"""MCP Protocol definitions and envelope classes."""

class MCPEnvelope(dict):
    """
    Typed helper for MCP envelope - at runtime it's just a dict.
    Provides compatibility for legacy code expecting dict-like access.
    """
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Set default values for common fields
        if 'id' not in self:
            import uuid
            self['id'] = str(uuid.uuid4())
        if 'method' not in self:
            self['method'] = 'execute_task'
        if 'params' not in self:
            self['params'] = {}
        if 'context' not in self:
            self['context'] = {}
        if 'instruction' not in self:
            self['instruction'] = kwargs.get('method', 'execute_task')
        if 'sender' not in self:
            self['sender'] = 'system'
        if 'recipient' not in self:
            self['recipient'] = 'coordinator'
    
    def __getattr__(self, name):
        """Allow attribute access for dict keys."""
        if name in self:
            return self[name]
        raise AttributeError(f"'{self.__class__.__name__}' object has no attribute '{name}'")
    
    def __setattr__(self, name, value):
        """Allow attribute setting for dict keys."""
        self[name] = value

__all__ = ['MCPEnvelope']