import _Principal "mo:base/Principal";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Int "mo:base/Int";
import Array "mo:base/Array";
import Result "mo:base/Result";
import Time "mo:base/Time";
import Iter "mo:base/Iter";
import HashMap "mo:base/HashMap";

persistent actor ChatStorage {
    public type ChatMessage = {
        id : Text;
        senderEmail : Text;
        receiverEmail : Text;
        message : Text;
        timestamp : Text;
        messageType : Text; // "text", "file", "image"
        fileUrl : ?Text;
        read : Bool;
    };

    public type ChatError = {
        #InvalidInput : Text;
        #MessageNotFound : Text;
        #Unauthorized : Text;
    };

    public type ChatResult<T> = Result.Result<T, ChatError>;

    private var messages : [ChatMessage] = [];
    private var messageIdCounter : Nat = 0;
    private flexible var messageMap = HashMap.HashMap<Text, ChatMessage>(0, Text.equal, Text.hash);

    private func generateMessageId() : Text {
        messageIdCounter += 1;
        return "msg_" # Nat.toText(messageIdCounter) # "_" # Int.toText(Time.now());
    };

    private func getCurrentTimestamp() : Text {
        let now = Time.now();
        Int.toText(now);
    };

    private func isValidEmail(email : Text) : Bool {
        Text.size(email) >= 5 and Text.contains(email, #text "@") and Text.contains(email, #text ".")
    };

    system func preupgrade() {
        messages := Iter.toArray(messageMap.vals());
    };

    system func postupgrade() {
        for (message in messages.vals()) {
            messageMap.put(message.id, message);
        };
    };

    // Save a message
    public shared func saveMessage(
        senderEmail : Text,
        receiverEmail : Text,
        message : Text,
        messageType : Text,
        fileUrl : ?Text
    ) : async ChatResult<Text> {
        // Input validation
        if (Text.size(senderEmail) == 0 or Text.size(receiverEmail) == 0 or Text.size(message) == 0) {
            return #err(#InvalidInput "Sender email, receiver email, and message are required");
        };

        if (not isValidEmail(senderEmail) or not isValidEmail(receiverEmail)) {
            return #err(#InvalidInput "Invalid email format");
        };

        let messageSize = Text.size(message);
        if (messageSize > 4000) {
            return #err(#InvalidInput "Message too long (max 4000 characters)");
        };

        let newMessage : ChatMessage = {
            id = generateMessageId();
            senderEmail = senderEmail;
            receiverEmail = receiverEmail;
            message = message;
            timestamp = getCurrentTimestamp();
            messageType = messageType;
            fileUrl = fileUrl;
            read = false;
        };

        // Store message
        messages := Array.append(messages, [newMessage]);
        messageMap.put(newMessage.id, newMessage);

        return #ok(newMessage.id);
    };

    // Get chat history between two users
    public shared query func getChatHistory(
        userEmail1 : Text,
        userEmail2 : Text,
        limit : Nat
    ) : async ChatResult<[ChatMessage]> {
        if (Text.size(userEmail1) == 0 or Text.size(userEmail2) == 0) {
            return #err(#InvalidInput "Both user emails are required");
        };

        var chatMessages : [ChatMessage] = [];

        for (msg in messages.vals()) {
            if ((msg.senderEmail == userEmail1 and msg.receiverEmail == userEmail2) or
                (msg.senderEmail == userEmail2 and msg.receiverEmail == userEmail1)) {
                chatMessages := Array.append(chatMessages, [msg]);
            };
        };

        // Return latest messages first (simple reverse)
        var result : [ChatMessage] = [];
        let size = chatMessages.size();
        
        // Safe calculation to avoid potential overflow
        let start = if (limit < size) { 
            let diff = Nat.sub(size, limit);
            diff
        } else { 0 };

        var i = start;
        while (i < size) {
            result := Array.append(result, [chatMessages[i]]);
            i += 1;
        };

        return #ok(result);
    };

    // Get all chats for a user (unique conversations)
    public shared query func getUserChats(userEmail : Text) : async ChatResult<[(Text, Text)]> {
        if (Text.size(userEmail) == 0) {
            return #err(#InvalidInput "User email is required");
        };

        var contacts : [(Text, Text)] = []; // (email, last_message)
        var seenContacts : [Text] = [];

        for (msg in messages.vals()) {
            if (msg.senderEmail == userEmail or msg.receiverEmail == userEmail) {
                let contact = if (msg.senderEmail == userEmail) { msg.receiverEmail } else { msg.senderEmail };

                var alreadySeen = false;
                for (seen in seenContacts.vals()) {
                    if (seen == contact) {
                        alreadySeen := true;
                    };
                };

                if (not alreadySeen) {
                    seenContacts := Array.append(seenContacts, [contact]);
                    contacts := Array.append(contacts, [(contact, msg.message)]);
                };
            };
        };

        return #ok(contacts);
    };

    // Mark message as read
    public shared func markAsRead(messageId : Text) : async ChatResult<Bool> {
        if (Text.size(messageId) == 0) {
            return #err(#InvalidInput "Message ID is required");
        };

        switch (messageMap.get(messageId)) {
            case (?message) {
                let updatedMessage = { message with read = true };
                messageMap.put(messageId, updatedMessage);

                // Update the messages array as well
                var updatedMessages : [ChatMessage] = [];
                for (msg in messages.vals()) {
                    if (msg.id == messageId) {
                        updatedMessages := Array.append(updatedMessages, [updatedMessage]);
                    } else {
                        updatedMessages := Array.append(updatedMessages, [msg]);
                    };
                };
                messages := updatedMessages;

                return #ok(true);
            };
            case null {
                return #err(#MessageNotFound "Message not found");
            };
        };
    };

    // Delete a message
    public shared func deleteMessage(messageId : Text) : async ChatResult<Bool> {
        if (Text.size(messageId) == 0) {
            return #err(#InvalidInput "Message ID is required");
        };

        var messageFound = false;
        var updatedMessages : [ChatMessage] = [];

        for (msg in messages.vals()) {
            if (msg.id != messageId) {
                updatedMessages := Array.append(updatedMessages, [msg]);
            } else {
                messageFound := true;
            };
        };

        if (messageFound) {
            messages := updatedMessages;
            messageMap.delete(messageId);
            return #ok(true);
        } else {
            return #err(#MessageNotFound "Message not found");
        };
    };

    // Get unread message count for a user
    public shared query func getUnreadCount(userEmail : Text) : async ChatResult<Nat> {
        if (Text.size(userEmail) == 0) {
            return #err(#InvalidInput "User email is required");
        };

        var unreadCount : Nat = 0;
        for (msg in messages.vals()) {
            if (msg.receiverEmail == userEmail and not msg.read) {
                unreadCount += 1;
            };
        };

        return #ok(unreadCount);
    };

    // Search messages
    public shared query func searchMessages(
        userEmail : Text,
        searchText : Text,
        limit : Nat
    ) : async ChatResult<[ChatMessage]> {
        if (Text.size(userEmail) == 0 or Text.size(searchText) == 0) {
            return #err(#InvalidInput "User email and search text are required");
        };

        var results : [ChatMessage] = [];

        var count = 0;
        for (msg in messages.vals()) {
            if ((msg.senderEmail == userEmail or msg.receiverEmail == userEmail) and
                Text.contains(msg.message, #text searchText)) {
                results := Array.append(results, [msg]);
                count += 1;

                if (count >= limit) {
                    // Stop adding more messages
                };
            };
        };

        return #ok(results);
    };

    // Get total message count
    public shared query func getTotalMessages() : async Nat {
        return messages.size();
    };

    // Health check
    public shared query func healthCheck() : async Text {
        return "Simple Chat Storage Canister is running";
    };
}