/**
 * escrow.mo, query methods only.
 *
 * Deliberately partial: create/release/refund/set_treasury are omitted so
 * nothing in this package can be pointed at them by accident. The inspector
 * that uses this reads and reports; it never moves money.
 */
export const idlFactory = ({ IDL }) => {
  const EscrowId = IDL.Text;

  const Plan = IDL.Variant({ 'basic': IDL.Null, 'premium': IDL.Null });

  const EscrowStatus = IDL.Variant({
    'created': IDL.Null,
    'funded': IDL.Null,
    'released': IDL.Null,
    'refunded': IDL.Null,
  });

  const Escrow = IDL.Record({
    'escrowId': EscrowId,
    'projectId': IDL.Text,
    'client': IDL.Principal,
    'freelancer': IDL.Principal,
    'expectedE8s': IDL.Nat,
    'status': EscrowStatus,
    'subaccount': IDL.Vec(IDL.Nat8),
    'createdAtNs': IDL.Nat64,
    'fundedAtNs': IDL.Opt(IDL.Nat64),
    'releaseAtNs': IDL.Opt(IDL.Nat64),
    'ledgerBlockIndex': IDL.Opt(IDL.Nat64),
    'plan': Plan,
  });

  const Account = IDL.Record({
    'owner': IDL.Principal,
    'subaccount': IDL.Opt(IDL.Vec(IDL.Nat8)),
  });

  return IDL.Service({
    'get': IDL.Func([EscrowId], [Escrow], ['query']),
    'get_deposit_account': IDL.Func([EscrowId], [Account], ['query']),
    'get_treasury': IDL.Func([], [IDL.Principal], ['query']),
    'get_relayer': IDL.Func([], [IDL.Opt(IDL.Principal)], ['query']),
  });
};

/** ICRC-1, only the two reads needed to price what an escrow is holding. */
export const ledgerIdlFactory = ({ IDL }) => {
  const Account = IDL.Record({
    'owner': IDL.Principal,
    'subaccount': IDL.Opt(IDL.Vec(IDL.Nat8)),
  });

  return IDL.Service({
    'icrc1_balance_of': IDL.Func([Account], [IDL.Nat], ['query']),
    'icrc1_fee': IDL.Func([], [IDL.Nat], ['query']),
  });
};
