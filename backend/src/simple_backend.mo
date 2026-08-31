import Debug "mo:base/Debug";

persistent actor {
  public query func greet(name : Text) : async Text {
    Debug.print("Hello, " # name # "!");
    return "Hello, " # name # "! This is a simple canister.";
  };

  public query func getVersion() : async Text {
    return "1.0.0";
  };
}