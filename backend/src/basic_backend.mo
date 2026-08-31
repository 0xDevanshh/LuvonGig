import Time "mo:base/Time";
import Array "mo:base/Array";

persistent actor {
  public type Message = {
    text: Text;
    from: Text;
    timestamp: Int;
  };

  var messages: [Message] = [];

  // Query function to get all messages
  public query func getMessages() : async [Message] {
    return messages;
  };

  // Update function to add a new message
  public func addMessage(text: Text, from: Text) : async () {
    let message : Message = {
      text = text;
      from = from;
      timestamp = Time.now();
    };
    messages := Array.append<Message>(messages, [message]);
  };

  // Query function to get message count
  public query func getMessageCount() : async Nat {
    return Array.size<Message>(messages);
  };

  // Update function to clear all messages
  public func clearMessages() : async () {
    messages := [];
  };

  // Simple greeting function
  public query func greet(name: Text) : async Text {
    return "Hello, " # name # "! This is your basic Motoko canister.";
  };
}