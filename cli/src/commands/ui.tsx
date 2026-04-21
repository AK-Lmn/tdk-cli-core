/**
 * tdk ui command - Interactive Terminal UI using Ink
 *
 * AWS CloudFormation/CDK-style tabbed interface with restrained neon design.
 * Only selected/active elements get neon treatment.
 */

import { Command } from 'commander';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { render, Box, Text, useInput, useApp, useStdout, useStdin } from 'ink';
import SelectInput from 'ink-select-input';
import { 
  discoverStacks, 
  discoverServices, 
  findProjectRoot,
  getServiceMetadata,
  getStackMetadata,
  clearMetadataCache,
  type ServiceMetadata,
  type StackMetadata,
} from '../utils/services.js';
import { isTiltAvailable } from '../utils/tilt.js';
import { TabBar, type TabId, DetailPanel, ResourceTable, FileTree, type FileNode } from '../components/index.js';

// Help Panel Component
const HelpPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <Box 
    borderStyle="single" 
    borderColor="cyan"
    paddingX={2}
    paddingY={1}
    flexDirection="column"
    width={60}
  >
    <Text bold color="cyan">Keyboard Shortcuts</Text>
    <Box marginY={1} flexDirection="column">
      <Text bold underline>Navigation</Text>
      <Text>  ↑/↓     Navigate list items</Text>
      <Text>  Enter   Select item / Open detail</Text>
      <Text>  Space   Toggle expand (tree view)</Text>
      <Text>  Tab     Next tab</Text>
      <Text>  1-5     Direct tab access</Text>
      
      <Text bold underline marginTop={1}>Actions</Text>
      <Text>  a       Toggle all/pre-alpha services</Text>
      <Text>  m       Toggle mouse support</Text>
      <Text>  r       Refresh data</Text>
      <Text>  /       Search/filter</Text>
      <Text>  ?       Show this help</Text>
      <Text>  q/Esc   Quit / Back</Text>
    </Box>
    <Box marginTop={1}>
      <Text color="gray" dimColor>Press any key to close...</Text>
    </Box>
  </Box>
);

// Loading Screen Component
const LoadingScreen: React.FC<{ progress: number; message: string }> = ({ progress, message }) => (
  <Box flexDirection="column" padding={2}>
    <Text bold color="cyan">▓▒░ TDK NEON EDITION ░▒▓</Text>
    <Box marginY={1} />
    <Text>Loading: {message}</Text>
    <Box marginY={1} borderStyle="single" borderColor="gray" width={50}>
      <Box width={progress / 2} backgroundColor="cyan">
        <Text>{' '.repeat(progress / 2)}</Text>
      </Box>
      <Text> {progress}%</Text>
    </Box>
  </Box>
);

// Error Screen Component
const ErrorScreen: React.FC<{ error: string; onRetry: () => void }> = ({ error, onRetry }) => (
  <Box flexDirection="column" padding={2} alignItems="center">
    <Text bold color="red">Connection Error</Text>
    <Box marginY={1} />
    <Text color="red">✗ {error}</Text>
    <Box marginY={1} />
    <Text color="gray">Troubleshooting:</Text>
    <Text color="gray">  1. Is Tilt running? Run: tilt up</Text>
    <Text color="gray">  2. Check Tiltfile exists</Text>
    <Text color="gray">  3. Try: tdk status --verbose</Text>
    <Box marginY={1} />
    <Text color="cyan">Press [r] to retry or [q] to quit</Text>
  </Box>
);

// Empty State Component
const EmptyState: React.FC = () => (
  <Box flexDirection="column" padding={2} alignItems="center">
    <Text bold color="yellow">No Services Found</Text>
    <Box marginY={1} />
    <Text color="gray">◉ No service.json files found</Text>
    <Box marginY={1} />
    <Text>To get started:</Text>
    <Text>  1. Run: tdk init</Text>
    <Text>  2. Or create services manually</Text>
    <Box marginY={1} />
    <Text color="gray">Press [q] to quit</Text>
  </Box>
);

// Main UI Component
const TUIApp: React.FC = () => {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const { stdin, setRawMode } = useStdin();
  
  // State
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [selectedStack, setSelectedStack] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showAllServices, setShowAllServices] = useState(false);
  const [terminalWidth, setTerminalWidth] = useState(stdout.columns || 120);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [mouseEnabled, setMouseEnabled] = useState(true);
  const [mouseClickY, setMouseClickY] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('Initializing...');
  const [error, setError] = useState<string | null>(null);

  // Data
  const projectRoot = findProjectRoot() || 'unknown';
  
  // Loading effect
  useEffect(() => {
    const loadSteps = [
      { msg: 'Discovering services...', progress: 20 },
      { msg: 'Loading stack metadata...', progress: 50 },
      { msg: 'Initializing UI...', progress: 80 },
      { msg: 'Ready!', progress: 100 },
    ];
    
    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < loadSteps.length) {
        const step = loadSteps[stepIndex];
        setLoadingMessage(step.msg);
        setLoadingProgress(step.progress);
        stepIndex++;
      } else {
        setLoading(false);
        clearInterval(interval);
      }
    }, 300);
    
    return () => clearInterval(interval);
  }, []);

  const stacks = discoverStacks({ preAlphaOnly: !showAllServices });
  const services = discoverServices({ preAlphaOnly: !showAllServices });
  
  // Handle errors
  useEffect(() => {
    try {
      if (services.length === 0) {
        setError('No services found. Run "tdk init" to get started.');
      } else {
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [services.length]);
  
  // Get metadata for selected stack
  const selectedStackData = useMemo(() => {
    if (!selectedStack) return null;
    const stack = stacks.find(s => s.name === selectedStack);
    if (!stack) return null;
    return {
      stack,
      metadata: getStackMetadata(stack),
    };
  }, [selectedStack, stacks]);

  // Get metadata for selected service
  const selectedServiceData = useMemo(() => {
    if (!selectedService) return null;
    const service = services.find(s => s.name === selectedService);
    if (!service) return null;
    return {
      service,
      metadata: getServiceMetadata(service),
    };
  }, [selectedService, services]);

  // Filtered items based on search
  const filteredStacks = useMemo(() => {
    if (!searchQuery) return stacks;
    return stacks.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.services.some(svc => svc.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [stacks, searchQuery]);

  const filteredServices = useMemo(() => {
    if (!searchQuery) return services;
    return services.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.domain || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [services, searchQuery]);

  // Build menu items for current tab
  const getItems = useCallback(() => {
    if (activeTab === 'overview') {
      return filteredStacks.map(stack => ({
        label: `${stack.name} (${stack.services.length} services)`,
        value: stack.name,
      }));
    }
    
    if (activeTab === 'resources') {
      if (selectedStackData) {
        return selectedStackData.stack.services.map(s => ({
          label: `${s.name} [${s.domain}]`,
          value: s.name,
        }));
      }
      return filteredStacks.map(stack => ({
        label: `${stack.name} (${stack.services.length} services)`,
        value: stack.name,
      }));
    }
    
    if (activeTab === 'files') {
      if (selectedServiceData) {
        return selectedServiceData.metadata.autogeneratedFiles.map(f => ({
          label: `${f.name} (${f.type})`,
          value: f.path,
        }));
      }
      return filteredServices.map(s => ({
        label: `${s.domain}/${s.name}`,
        value: s.name,
      }));
    }
    
    if (activeTab === 'config') {
      return filteredServices.map(s => ({
        label: `${s.domain}/${s.name} ${s.stack ? `[${s.stack}]` : ''}`,
        value: s.name,
      }));
    }
    
    return [];
  }, [activeTab, filteredStacks, filteredServices, selectedStackData, selectedServiceData]);

  const items = getItems();

  // Handle selection
  const handleSelect = useCallback((item: { label: string; value: string }) => {
    if (activeTab === 'overview') {
      setSelectedStack(item.value);
      setSelectedService(null);
      setMessage(`Selected stack: ${item.value}`);
      setTimeout(() => setMessage(''), 2000);
    } else if (activeTab === 'resources') {
      if (selectedStack && !selectedService) {
        setSelectedService(item.value);
        setMessage(`Selected service: ${item.value}`);
        setTimeout(() => setMessage(''), 2000);
      } else {
        setSelectedStack(item.value);
        setSelectedService(null);
      }
    } else if (activeTab === 'files') {
      if (selectedService) {
        setSelectedFile(item.value);
        setMessage(`Selected file: ${item.label}`);
        setTimeout(() => setMessage(''), 2000);
      } else {
        setSelectedService(item.value);
        setMessage(`Selected service: ${item.value}`);
        setTimeout(() => setMessage(''), 2000);
      }
    } else if (activeTab === 'config') {
      setSelectedService(item.value);
      setMessage(`Viewing config for: ${item.value}`);
      setTimeout(() => setMessage(''), 2000);
    }
  }, [activeTab, selectedStack, selectedService, setSelectedStack, setSelectedService, setSelectedFile, setMessage]);

  // Enable raw mode
  useEffect(() => {
    setRawMode(true);
    return () => {
      setRawMode(false);
    };
  }, [setRawMode]);

  // Handle terminal resize
  useEffect(() => {
    const handleResize = () => {
      setTerminalWidth(stdout.columns || 120);
    };
    
    stdout.on('resize', handleResize);
    return () => {
      stdout.off('resize', handleResize);
    };
  }, [stdout]);

  // Keyboard handling
  useInput((input, key) => {
    if (error) {
      if (input === 'r' || input === 'R') {
        setError(null);
        setLoading(true);
        setLoadingProgress(0);
        return;
      }
      if (input === 'q' || key.escape) {
        exit();
        return;
      }
      return;
    }

    if (showHelp) {
      setShowHelp(false);
      return;
    }

    if (isSearching) {
      if (key.return) {
        setIsSearching(false);
        return;
      }
      if (key.escape) {
        setIsSearching(false);
        setSearchQuery('');
        return;
      }
      if (key.backspace || key.delete) {
        setSearchQuery(prev => prev.slice(0, -1));
        return;
      }
      if (input && !key.ctrl && !key.meta) {
        setSearchQuery(prev => prev + input);
        return;
      }
      return;
    }

    if (input === 'q' && !key.ctrl && !key.meta) {
      exit();
      return;
    }
    
    if (key.escape) {
      if (filePreview) {
        setFilePreview(null);
        return;
      }
      if (selectedFile) {
        setSelectedFile(null);
        return;
      }
      if (selectedService) {
        setSelectedService(null);
        return;
      }
      if (selectedStack) {
        setSelectedStack(null);
        return;
      }
      exit();
      return;
    }

    if (input === '?') {
      setShowHelp(true);
      return;
    }

    if (input === 'r') {
      clearMetadataCache();
      setMessage('Data refreshed');
      setTimeout(() => setMessage(''), 1500);
      return;
    }

    if (input === '/') {
      setIsSearching(true);
      setSearchQuery('');
      setMessage('Search: ');
      return;
    }

    if (input === 'a') {
      setShowAllServices(prev => !prev);
      setMessage(showAllServices ? 'Showing pre-alpha services only' : 'Showing all services');
      setTimeout(() => setMessage(''), 1500);
      return;
    }

    if (input === 'm') {
      setMouseEnabled(prev => {
        const newState = !prev;
        setMessage(newState ? 'Mouse support enabled' : 'Mouse support disabled');
        return newState;
      });
      setTimeout(() => setMessage(''), 1500);
      return;
    }

    if (key.tab) {
      const tabs: TabId[] = ['overview', 'resources', 'events', 'files', 'config'];
      const currentIdx = tabs.indexOf(activeTab);
      const nextIdx = key.shift 
        ? (currentIdx - 1 + tabs.length) % tabs.length 
        : (currentIdx + 1) % tabs.length;
      setActiveTab(tabs[nextIdx]);
      setHighlightedIndex(0);
      return;
    }

    if (/^[1-5]$/.test(input)) {
      const tabMap: Record<string, TabId> = {
        '1': 'overview',
        '2': 'resources',
        '3': 'events',
        '4': 'files',
        '5': 'config',
      };
      setActiveTab(tabMap[input]);
      setHighlightedIndex(0);
      return;
    }

    if (key.upArrow) {
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : items.length - 1));
    }
    if (key.downArrow) {
      setHighlightedIndex(prev => (prev < items.length - 1 ? prev + 1 : 0));
    }
    if (key.return || input === ' ') {
      const currentItem = items[highlightedIndex];
      if (currentItem) {
        handleSelect(currentItem);
      }
      return;
    }
  });

  // Build file tree for Files tab
  const fileTreeNodes: FileNode[] = useMemo(() => {
    if (selectedServiceData) {
      return [{
        name: selectedServiceData.service.name,
        path: selectedServiceData.service.path,
        type: 'directory',
        children: selectedServiceData.metadata.autogeneratedFiles.map(f => ({
          name: f.name,
          path: f.path,
          type: 'file',
          fileType: f.type,
          size: f.size,
          lastModified: f.lastModified,
        })),
      }];
    }
    return services.map(s => ({
      name: s.name,
      path: s.path,
      type: 'directory',
      children: [],
    }));
  }, [selectedServiceData, services]);

  // Responsive layout
  const showSidebar = terminalWidth > 100;
  const compactTabBar = terminalWidth < 100;
  const compact = terminalWidth < 80;

  // Loading state
  if (loading) {
    return <LoadingScreen progress={loadingProgress} message={loadingMessage} />;
  }

  // Error state
  if (error) {
    return <ErrorScreen error={error} onRetry={() => {
      setError(null);
      setLoading(true);
      setLoadingProgress(0);
    }} />;
  }

  // Empty state
  if (services.length === 0) {
    return <EmptyState />;
  }

  return (
    <Box flexDirection="column" height={stdout.rows || 24}>
      {/* Header - Single row, restrained */}
      <Box paddingX={1} paddingY={0}>
        <Text>
          <Text color="cyan" bold>▓▒░ TDK NEON EDITION ░▒▓</Text>
          <Text color="gray">  │  </Text>
          <Text color="white">{projectRoot}</Text>
          <Text color="gray">  │  </Text>
          <Text color="green">{services.length} services ready</Text>
        </Text>
      </Box>

      {/* Separator */}
      <Box paddingX={1}>
        <Text color="gray">{'─'.repeat(compact ? 60 : Math.min(terminalWidth - 4, 100))}</Text>
      </Box>

      {/* Search indicator */}
      {isSearching && (
        <Box paddingX={1} height={1}>
          <Text color="yellow">Search: {searchQuery}_</Text>
        </Box>
      )}

      {/* Message area */}
      {!isSearching && message && (
        <Box paddingX={1} height={1}>
          <Text color="cyan">▓▒░ {message} ░▒▓</Text>
        </Box>
      )}

      {/* Help Panel */}
      {showHelp && (
        <Box paddingX={1} flexGrow={1}>
          <HelpPanel onClose={() => setShowHelp(false)} />
        </Box>
      )}

      {/* File Preview */}
      {filePreview && (
        <Box 
          borderStyle="single" 
          borderColor="cyan"
          paddingX={2}
          paddingY={1}
          flexDirection="column"
          flexGrow={1}
          width={terminalWidth - 4}
        >
          <Text bold color="cyan">File Preview</Text>
          <Box marginY={1}>
            <Text color="gray" wrap="wrap">{filePreview.slice(0, 2000)}...</Text>
          </Box>
          <Text color="gray" dimColor>Press [Esc] to close</Text>
        </Box>
      )}

      {/* Main Content */}
      {!showHelp && !filePreview && (
        <>
          {/* Tab Bar */}
          <Box marginTop={1}>
            <TabBar 
              activeTab={activeTab} 
              onTabChange={setActiveTab}
              compact={compactTabBar}
            />
          </Box>

          {/* Content Area */}
          <Box flexDirection="row" paddingX={1} flexGrow={1}>
            {/* Left: Main Content */}
            <Box flexDirection="column" flexGrow={1} width={showSidebar ? terminalWidth - 45 : terminalWidth - 4}>
              
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <>
                  <Box marginBottom={1}>
                    <Text bold color="gray">┌─ Stacks ─</Text>
                  </Box>
                  <Box marginTop={1} flexGrow={1}>
                    <SelectInput 
                      items={items} 
                      onSelect={handleSelect}
                      initialIndex={highlightedIndex}
                      indicatorComponent={({ isSelected }) => (
                        <Text color={isSelected ? 'cyan' : undefined}>
                          {isSelected ? '▓▒░ ' : '    '}
                        </Text>
                      )}
                      itemComponent={({ isSelected, label }) => (
                        <Text 
                          color={isSelected ? 'cyan' : 'white'} 
                          bold={isSelected}
                          backgroundColor={isSelected ? 'black' : undefined}
                        >
                          {label}
                        </Text>
                      )}
                    />
                  </Box>
                </>
              )}

              {/* Resources Tab */}
              {activeTab === 'resources' && (
                <>
                  <Box marginBottom={1}>
                    <Text bold color="gray">┌─ Resources ─</Text>
                  </Box>
                  {selectedStackData ? (
                    <>
                      <Text color="gray">Stack: {selectedStackData.stack.name}</Text>
                      <Box marginTop={1}>
                        <ResourceTable 
                          services={selectedStackData.metadata.services}
                          maxWidth={terminalWidth - (showSidebar ? 50 : 10)}
                        />
                      </Box>
                    </>
                  ) : (
                    <>
                      <Text color="gray">Select a stack to view resources</Text>
                      <Box marginTop={1}>
                        <SelectInput 
                          items={items} 
                          onSelect={handleSelect}
                          initialIndex={highlightedIndex}
                          indicatorComponent={({ isSelected }) => (
                            <Text color={isSelected ? 'cyan' : undefined}>
                              {isSelected ? '▓▒░ ' : '    '}
                            </Text>
                          )}
                          itemComponent={({ isSelected, label }) => (
                            <Text color={isSelected ? 'cyan' : 'white'} bold={isSelected}>
                              {label}
                            </Text>
                          )}
                        />
                      </Box>
                    </>
                  )}
                </>
              )}

              {/* Events Tab */}
              {activeTab === 'events' && (
                <>
                  <Box marginBottom={1}>
                    <Text bold color="gray">┌─ Events ─</Text>
                  </Box>
                  <Box marginTop={1}>
                    <Text color="gray">Event timeline coming soon...</Text>
                    <Text color="gray" dimColor>
                      This tab will show service lifecycle events.
                    </Text>
                  </Box>
                </>
              )}

              {/* Files Tab */}
              {activeTab === 'files' && (
                <>
                  <Box marginBottom={1}>
                    <Text bold color="gray">┌─ Autogenerated Files ─</Text>
                  </Box>
                  {selectedServiceData ? (
                    <>
                      <Text color="gray">Service: {selectedServiceData.service.name}</Text>
                      <Box marginTop={1}>
                        <FileTree 
                          nodes={fileTreeNodes}
                          selectedPath={selectedFile || undefined}
                        />
                      </Box>
                    </>
                  ) : (
                    <>
                      <Text color="gray">Select a service to view files</Text>
                      <Box marginTop={1}>
                        <SelectInput 
                          items={items} 
                          onSelect={handleSelect}
                          initialIndex={highlightedIndex}
                          indicatorComponent={({ isSelected }) => (
                            <Text color={isSelected ? 'cyan' : undefined}>
                              {isSelected ? '▓▒░ ' : '    '}
                            </Text>
                          )}
                          itemComponent={({ isSelected, label }) => (
                            <Text color={isSelected ? 'cyan' : 'white'} bold={isSelected}>
                              {label}
                            </Text>
                          )}
                        />
                      </Box>
                    </>
                  )}
                </>
              )}

              {/* Config Tab */}
              {activeTab === 'config' && (
                <>
                  <Box marginBottom={1}>
                    <Text bold color="gray">┌─ Configuration ─</Text>
                  </Box>
                  {selectedServiceData ? (
                    <Box marginTop={1} flexDirection="column">
                      <Text color="cyan">{selectedServiceData.service.configPath}</Text>
                      <Box marginTop={1} borderStyle="single" borderColor="gray" paddingX={1}>
                        <Text color="gray" wrap="wrap">
                          {JSON.stringify(selectedServiceData.service.config, null, 2).slice(0, 1000)}
                        </Text>
                      </Box>
                    </Box>
                  ) : (
                    <>
                      <Text color="gray">Select a service to view configuration</Text>
                      <Box marginTop={1}>
                        <SelectInput 
                          items={items} 
                          onSelect={handleSelect}
                          initialIndex={highlightedIndex}
                          indicatorComponent={({ isSelected }) => (
                            <Text color={isSelected ? 'cyan' : undefined}>
                              {isSelected ? '▓▒░ ' : '    '}
                            </Text>
                          )}
                          itemComponent={({ isSelected, label }) => (
                            <Text color={isSelected ? 'cyan' : 'white'} bold={isSelected}>
                              {label}
                            </Text>
                          )}
                        />
                      </Box>
                    </>
                  )}
                </>
              )}
            </Box>

            {/* Right: Detail Panel */}
            {showSidebar && (
              <Box marginLeft={2}>
                <DetailPanel 
                  stack={selectedStackData?.stack || null}
                  service={selectedServiceData?.service || null}
                  stackMetadata={selectedStackData?.metadata || null}
                  visible={!!selectedStack || !!selectedService}
                />
              </Box>
            )}
          </Box>

          {/* Status Bar */}
          <Box 
            borderStyle="single" 
            borderColor="gray" 
            paddingX={1}
            height={3}
            flexDirection="column"
            marginTop={1}
          >
            <Box justifyContent="space-between">
              <Text color="cyan" bold>▓▒░ {activeTab}</Text>
              <Text color="green">● {services.filter(s => s.stack).length} in stack</Text>
              <Text color="yellow">○ {services.filter(s => !s.stack).length} no stack</Text>
              <Text color={showAllServices ? 'pink' : 'blue'}>
                {showAllServices ? '[a] All' : '[a] Pre-alpha'}
              </Text>
            </Box>
            <Box justifyContent="space-between">
              <Text color="gray">Stacks: {stacks.length}</Text>
              <Text color="gray">Services: {services.length}</Text>
              <Text color="gray">🖱️ {mouseEnabled ? 'ON' : 'OFF'} │ [?] Help │ [q] Quit</Text>
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
};

export const uiCommand = new Command('ui')
  .description('Interactive TUI for managing stacks and services (Neon Edition)')
  .alias('interactive')
  .option('-v, --verbose', 'Enable verbose output', false)
  .option('--no-animations', 'Disable animations')
  .option('--high-contrast', 'Enable high contrast mode')
  .action(async () => {
    try {
      const tiltAvailable = await isTiltAvailable();
      if (!tiltAvailable) {
        console.error('Error: tilt CLI not found. Make sure Tilt is installed.');
        process.exit(1);
      }

      const projectRoot = findProjectRoot();
      if (!projectRoot) {
        console.error('Error: Could not find project root (no Tiltfile found).');
        process.exit(1);
      }

      render(<TUIApp />);

    } catch (err) {
      console.error(`Error: ${err}`);
      process.exit(1);
    }
  });
