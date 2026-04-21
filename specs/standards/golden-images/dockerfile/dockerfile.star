# Dockerfile generation exports
load('../generators/golden_docker_generator_v2.star', 'L4_generate_orchestrator')
load('../../../../../.tilt/TILT_SERVICE_DEFAULTS.star', 'BASE_PORT_FRONTEND', 'BASE_PORT_BACKEND')

def generate_frontend_dockerfile(res_path, service_name, port=BASE_PORT_FRONTEND, target_path='/app/dist', build_cmd='bun run build', cmd='bun run start', use_nginx=False, use_infisical=True, use_shared_libs=True, use_prisma=False, use_golden=True, manifest=None):
    """Generate Dockerfile for frontend services."""
    return L4_generate_orchestrator(
        res_path=res_path,
        res_type='frontend',
        service_name=service_name,
        use_nginx=use_nginx,
        port=port,
        target_path=target_path,
        build_cmd=build_cmd,
        cmd=cmd,
        use_infisical=use_infisical,
        use_shared_libs=use_shared_libs,
        use_prisma=use_prisma,
        use_golden=use_golden,
        manifest=manifest,
    )

def generate_app_dockerfile(res_path, service_name, port=BASE_PORT_BACKEND, build_cmd='bun run build', cmd='bun run start', use_infisical=True, use_shared_libs=True, use_prisma=True, use_golden=True, manifest=None):
    """Generate Dockerfile for backend/app services."""
    return L4_generate_orchestrator(
        res_path=res_path,
        res_type='backend',
        service_name=service_name,
        port=port,
        build_cmd=build_cmd,
        cmd=cmd,
        use_infisical=use_infisical,
        use_shared_libs=use_shared_libs,
        use_prisma=use_prisma,
        use_golden=use_golden,
        manifest=manifest,
    )

def generate_migrator_dockerfile(res_path, service_name, use_infisical=True, use_golden=True, manifest=None):
    """Generate Dockerfile for database migrator services."""
    return L4_generate_orchestrator(
        res_path=res_path,
        res_type='migrator',
        service_name=service_name,
        use_infisical=use_infisical,
        use_golden=use_golden,
        manifest=manifest,
    )
