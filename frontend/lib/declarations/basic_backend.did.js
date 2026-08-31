export const idlFactory = ({ IDL }) => {
  const Message = IDL.Record({
    'from' : IDL.Text,
    'text' : IDL.Text,
    'timestamp' : IDL.Int,
  });
  return IDL.Service({
    'addMessage' : IDL.Func([IDL.Text, IDL.Text], [], []),
    'clearMessages' : IDL.Func([], [], []),
    'getMessageCount' : IDL.Func([], [IDL.Nat], ['query']),
    'getMessages' : IDL.Func([], [IDL.Vec(Message)], ['query']),
    'greet' : IDL.Func([IDL.Text], [IDL.Text], ['query']),
  });
};
export const init = ({ IDL }) => { return []; };
