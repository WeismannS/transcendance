type StateEvent = "profile" | "social" | "achievments" | "tournaments"



class ServerManager
{
    private listeners : Map<StateEvent, Set<Function>> = new Map();
    private states 
}   