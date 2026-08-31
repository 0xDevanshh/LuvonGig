export const idlFactory = ({ IDL }) => {
  const EscrowId = IDL.Text;
  const Account = IDL.Record({
    'owner' : IDL.Principal,
    'subaccount' : IDL.Opt(IDL.Vec(IDL.Nat8)),
  });
  const EscrowStatus = IDL.Variant({
    'created' : IDL.Null,
    'refunded' : IDL.Null,
    'funded' : IDL.Null,
    'released' : IDL.Null,
  });
  const Escrow = IDL.Record({
    'status' : EscrowStatus,
    'client' : IDL.Principal,
    'subaccount' : IDL.Vec(IDL.Nat8),
    'createdAtNs' : IDL.Nat64,
    'projectId' : IDL.Text,
    'expectedE8s' : IDL.Nat,
    'escrowId' : EscrowId,
    'ledgerBlockIndex' : IDL.Opt(IDL.Nat64),
    'freelancer' : IDL.Principal,
    'releaseAtNs' : IDL.Opt(IDL.Nat64),
    'fundedAtNs' : IDL.Opt(IDL.Nat64),
  });
  const RefreshResult = IDL.Record({
    'funded' : IDL.Bool,
    'balanceE8s' : IDL.Nat,
  });
  const TransferResult = IDL.Variant({ 'ok' : IDL.Nat, 'err' : IDL.Text });
  return IDL.Service({
    'create' : IDL.Func(
        [IDL.Text, IDL.Principal, IDL.Principal, IDL.Nat],
        [EscrowId, Account],
        [],
      ),
    'get' : IDL.Func([EscrowId], [Escrow], ['query']),
    'get_deposit_account' : IDL.Func([EscrowId], [Account], ['query']),
    'get_relayer' : IDL.Func([], [IDL.Opt(IDL.Principal)], ['query']),
    'get_treasury' : IDL.Func([], [IDL.Principal], ['query']),
    'refresh_funding' : IDL.Func([EscrowId], [RefreshResult], []),
    'refund' : IDL.Func([EscrowId], [TransferResult], []),
    'release' : IDL.Func([EscrowId, IDL.Nat], [TransferResult], []),
    'set_relayer' : IDL.Func([IDL.Opt(IDL.Principal)], [], []),
    'set_treasury' : IDL.Func([IDL.Principal], [], []),
  });
};
export const init = ({ IDL }) => { return []; };
