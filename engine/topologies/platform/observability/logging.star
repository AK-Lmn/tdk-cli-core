load("../../tilt/resources/infra-loader.star", _Infra = "Infra")

def load_elk(should_enable):
    return _Infra.load_elk(should_enable)
