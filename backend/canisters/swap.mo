// This is a generated Motoko binding.
// Please use `import service "ic:canister_id"` instead to call canisters on the IC if possible.

module {
  public type AddLiquiditAmountsResult = {
    #Ok : AddLiquidityAmountsReply;
    #Err : Text;
  };
  public type AddLiquidityAmountsReply = {
    add_lp_token_amount : Nat;
    amount_0 : Nat;
    amount_1 : Nat;
    address_0 : Text;
    address_1 : Text;
    symbol_0 : Text;
    symbol_1 : Text;
    chain_0 : Text;
    chain_1 : Text;
    symbol : Text;
    fee_0 : Nat;
    fee_1 : Nat;
  };
  public type AddLiquidityArgs = {
    token_0 : Text;
    token_1 : Text;
    amount_0 : Nat;
    amount_1 : Nat;
    tx_id_0 : ?TxId;
    tx_id_1 : ?TxId;
  };
  public type AddLiquidityAsyncResult = { #Ok : Nat64; #Err : Text };
  public type AddLiquidityReply = {
    ts : Nat64;
    request_id : Nat64;
    status : Text;
    tx_id : Nat64;
    add_lp_token_amount : Nat;
    transfer_ids : [TransferIdReply];
    amount_0 : Nat;
    amount_1 : Nat;
    claim_ids : [Nat64];
    address_0 : Text;
    address_1 : Text;
    symbol_0 : Text;
    symbol_1 : Text;
    chain_0 : Text;
    chain_1 : Text;
    symbol : Text;
  };
  public type AddLiquidityResult = { #Ok : AddLiquidityReply; #Err : Text };
  public type AddPoolArgs = {
    token_0 : Text;
    token_1 : Text;
    amount_0 : Nat;
    amount_1 : Nat;
    tx_id_0 : ?TxId;
    tx_id_1 : ?TxId;
    lp_fee_bps : ?Nat8;
  };
  public type AddPoolReply = {
    ts : Nat64;
    request_id : Nat64;
    status : Text;
    tx_id : Nat64;
    lp_token_symbol : Text;
    add_lp_token_amount : Nat;
    transfer_ids : [TransferIdReply];
    name : Text;
    amount_0 : Nat;
    amount_1 : Nat;
    claim_ids : [Nat64];
    address_0 : Text;
    address_1 : Text;
    symbol_0 : Text;
    symbol_1 : Text;
    pool_id : Nat32;
    chain_0 : Text;
    chain_1 : Text;
    is_removed : Bool;
    symbol : Text;
    lp_fee_bps : Nat8;
  };
  public type AddPoolResult = { #Ok : AddPoolReply; #Err : Text };
  public type AddTokenArgs = { token : Text };
  public type AddTokenReply = { #IC : ICTokenReply };
  public type AddTokenResult = { #Ok : AddTokenReply; #Err : Text };
  public type CheckPoolsReply = {
    expected_balance : ExpectedBalance;
    diff_balance : Int;
    actual_balance : Nat;
    symbol : Text;
  };
  public type CheckPoolsResult = { #Ok : [CheckPoolsReply]; #Err : Text };
  public type ClaimReply = {
    ts : Nat64;
    fee : Nat;
    status : Text;
    claim_id : Nat64;
    transfer_ids : [TransferIdReply];
    desc : Text;
    chain : Text;
    canister_id : ?Text;
    to_address : Text;
    amount : Nat;
    symbol : Text;
  };
  public type ClaimResult = { #Ok : ClaimReply; #Err : Text };
  public type ClaimsReply = {
    ts : Nat64;
    fee : Nat;
    status : Text;
    claim_id : Nat64;
    desc : Text;
    chain : Text;
    canister_id : ?Text;
    to_address : Text;
    amount : Nat;
    symbol : Text;
  };
  public type ClaimsResult = { #Ok : [ClaimsReply]; #Err : Text };
  public type ExpectedBalance = {
    balance : Nat;
    pool_balances : [PoolExpectedBalance];
    unclaimed_claims : Nat;
  };
  public type ICTokenReply = {
    fee : Nat;
    decimals : Nat8;
    token_id : Nat32;
    chain : Text;
    name : Text;
    canister_id : Text;
    icrc1 : Bool;
    icrc2 : Bool;
    icrc3 : Bool;
    is_removed : Bool;
    symbol : Text;
  };
  public type ICTransferReply = {
    is_send : Bool;
    block_index : Nat;
    chain : Text;
    canister_id : Text;
    amount : Nat;
    symbol : Text;
  };
  public type Icrc10SupportedStandards = { url : Text; name : Text };
  public type Icrc28TrustedOriginsResponse = { trusted_origins : [Text] };
  public type LPBalancesReply = {
    ts : Nat64;
    usd_balance : Float;
    balance : Float;
    name : Text;
    amount_0 : Float;
    amount_1 : Float;
    address_0 : Text;
    address_1 : Text;
    symbol_0 : Text;
    symbol_1 : Text;
    usd_amount_0 : Float;
    usd_amount_1 : Float;
    chain_0 : Text;
    chain_1 : Text;
    symbol : Text;
    lp_token_id : Nat64;
  };
  public type LPTokenReply = {
    fee : Nat;
    decimals : Nat8;
    token_id : Nat32;
    chain : Text;
    name : Text;
    address : Text;
    pool_id_of : Nat32;
    is_removed : Bool;
    total_supply : Nat;
    symbol : Text;
  };
  public type MessagesReply = {
    ts : Nat64;
    title : Text;
    message : Text;
    message_id : Nat64;
  };
  public type MessagesResult = { #Ok : [MessagesReply]; #Err : Text };
  public type PoolExpectedBalance = {
    balance : Nat;
    kong_fee : Nat;
    pool_symbol : Text;
    lp_fee : Nat;
  };
  public type PoolReply = {
    lp_token_symbol : Text;
    name : Text;
    lp_fee_0 : Nat;
    lp_fee_1 : Nat;
    balance_0 : Nat;
    balance_1 : Nat;
    address_0 : Text;
    address_1 : Text;
    symbol_0 : Text;
    symbol_1 : Text;
    pool_id : Nat32;
    price : Float;
    chain_0 : Text;
    chain_1 : Text;
    is_removed : Bool;
    symbol : Text;
    lp_fee_bps : Nat8;
  };
  public type PoolsResult = { #Ok : [PoolReply]; #Err : Text };
  public type RemoveLiquidityAmountsReply = {
    lp_fee_0 : Nat;
    lp_fee_1 : Nat;
    amount_0 : Nat;
    amount_1 : Nat;
    address_0 : Text;
    address_1 : Text;
    symbol_0 : Text;
    symbol_1 : Text;
    chain_0 : Text;
    chain_1 : Text;
    remove_lp_token_amount : Nat;
    symbol : Text;
  };
  public type RemoveLiquidityAmountsResult = {
    #Ok : RemoveLiquidityAmountsReply;
    #Err : Text;
  };
  public type RemoveLiquidityArgs = {
    token_0 : Text;
    token_1 : Text;
    remove_lp_token_amount : Nat;
  };
  public type RemoveLiquidityAsyncResult = { #Ok : Nat64; #Err : Text };
  public type RemoveLiquidityReply = {
    ts : Nat64;
    request_id : Nat64;
    status : Text;
    tx_id : Nat64;
    transfer_ids : [TransferIdReply];
    lp_fee_0 : Nat;
    lp_fee_1 : Nat;
    amount_0 : Nat;
    amount_1 : Nat;
    claim_ids : [Nat64];
    address_0 : Text;
    address_1 : Text;
    symbol_0 : Text;
    symbol_1 : Text;
    chain_0 : Text;
    chain_1 : Text;
    remove_lp_token_amount : Nat;
    symbol : Text;
  };
  public type RemoveLiquidityResult = {
    #Ok : RemoveLiquidityReply;
    #Err : Text;
  };
  public type RequestReply = {
    #AddLiquidity : AddLiquidityReply;
    #Swap : SwapReply;
    #AddPool : AddPoolReply;
    #RemoveLiquidity : RemoveLiquidityReply;
    #Pending;
  };
  public type RequestRequest = {
    #AddLiquidity : AddLiquidityArgs;
    #Swap : SwapArgs;
    #AddPool : AddPoolArgs;
    #RemoveLiquidity : RemoveLiquidityArgs;
  };
  public type RequestsReply = {
    ts : Nat64;
    request_id : Nat64;
    request : RequestRequest;
    statuses : [Text];
    reply : RequestReply;
  };
  public type RequestsResult = { #Ok : [RequestsReply]; #Err : Text };
  public type SendArgs = { token : Text; to_address : Text; amount : Nat };
  public type SendReply = {
    ts : Nat64;
    request_id : Nat64;
    status : Text;
    tx_id : Nat64;
    chain : Text;
    to_address : Text;
    amount : Nat;
    symbol : Text;
  };
  public type SendResult = { #Ok : SendReply; #Err : Text };
  public type SwapAmountsReply = {
    txs : [SwapAmountsTxReply];
    receive_chain : Text;
    mid_price : Float;
    pay_amount : Nat;
    receive_amount : Nat;
    pay_symbol : Text;
    receive_symbol : Text;
    receive_address : Text;
    pay_address : Text;
    price : Float;
    pay_chain : Text;
    slippage : Float;
  };
  public type SwapAmountsResult = { #Ok : SwapAmountsReply; #Err : Text };
  public type SwapAmountsTxReply = {
    receive_chain : Text;
    pay_amount : Nat;
    receive_amount : Nat;
    pay_symbol : Text;
    receive_symbol : Text;
    receive_address : Text;
    pool_symbol : Text;
    pay_address : Text;
    price : Float;
    pay_chain : Text;
    lp_fee : Nat;
    gas_fee : Nat;
  };
  public type SwapArgs = {
    receive_token : Text;
    max_slippage : ?Float;
    pay_amount : Nat;
    referred_by : ?Text;
    receive_amount : ?Nat;
    receive_address : ?Text;
    pay_token : Text;
    pay_tx_id : ?TxId;
  };
  public type SwapAsyncResult = { #Ok : Nat64; #Err : Text };
  public type SwapReply = {
    ts : Nat64;
    txs : [SwapTxReply];
    request_id : Nat64;
    status : Text;
    tx_id : Nat64;
    transfer_ids : [TransferIdReply];
    receive_chain : Text;
    mid_price : Float;
    pay_amount : Nat;
    receive_amount : Nat;
    claim_ids : [Nat64];
    pay_symbol : Text;
    receive_symbol : Text;
    receive_address : Text;
    pay_address : Text;
    price : Float;
    pay_chain : Text;
    slippage : Float;
  };
  public type SwapResult = { #Ok : SwapReply; #Err : Text };
  public type SwapTxReply = {
    ts : Nat64;
    receive_chain : Text;
    pay_amount : Nat;
    receive_amount : Nat;
    pay_symbol : Text;
    receive_symbol : Text;
    receive_address : Text;
    pool_symbol : Text;
    pay_address : Text;
    price : Float;
    pay_chain : Text;
    lp_fee : Nat;
    gas_fee : Nat;
  };
  public type TokenReply = { #IC : ICTokenReply; #LP : LPTokenReply };
  public type TokensResult = { #Ok : [TokenReply]; #Err : Text };
  public type TransferIdReply = {
    transfer_id : Nat64;
    transfer : TransferReply;
  };
  public type TransferReply = { #IC : ICTransferReply };
  public type TransfersResult = { #Ok : [TransferIdReply]; #Err : Text };
  public type TxId = { #TransactionId : Text; #BlockIndex : Nat };
  public type TxsReply = {
    #AddLiquidity : AddLiquidityReply;
    #Swap : SwapReply;
    #AddPool : AddPoolReply;
    #RemoveLiquidity : RemoveLiquidityReply;
  };
  public type TxsResult = { #Ok : [TxsReply]; #Err : Text };
  public type UpdateTokenArgs = { token : Text };
  public type UpdateTokenReply = { #IC : ICTokenReply };
  public type UpdateTokenResult = { #Ok : UpdateTokenReply; #Err : Text };
  public type UserBalancesReply = { #LP : LPBalancesReply };
  public type UserBalancesResult = { #Ok : [UserBalancesReply]; #Err : Text };
  public type UserReply = {
    account_id : Text;
    fee_level_expires_at : ?Nat64;
    referred_by : ?Text;
    user_id : Nat32;
    fee_level : Nat8;
    principal_id : Text;
    referred_by_expires_at : ?Nat64;
    my_referral_code : Text;
  };
  public type UserResult = { #Ok : UserReply; #Err : Text };
  public type ValidateAddLiquidityResult = { #Ok : Text; #Err : Text };
  public type ValidateRemoveLiquidityResult = { #Ok : Text; #Err : Text };
  public type icrc21_consent_info = {
    metadata : icrc21_consent_message_metadata;
    consent_message : icrc21_consent_message;
  };
  public type icrc21_consent_message = {
    #LineDisplayMessage : { pages : [{ lines : [Text] }] };
    #GenericDisplayMessage : Text;
  };
  public type icrc21_consent_message_metadata = {
    utc_offset_minutes : ?Int16;
    language : Text;
  };
  public type icrc21_consent_message_request = {
    arg : Blob;
    method : Text;
    user_preferences : icrc21_consent_message_spec;
  };
  public type icrc21_consent_message_response = {
    #Ok : icrc21_consent_info;
    #Err : icrc21_error;
  };
  public type icrc21_consent_message_spec = {
    metadata : icrc21_consent_message_metadata;
    device_spec : ?{
      #GenericDisplay;
      #LineDisplay : { characters_per_line : Nat16; lines_per_page : Nat16 };
    };
  };
  public type icrc21_error = {
    #GenericError : { description : Text; error_code : Nat };
    #InsufficientPayment : icrc21_error_info;
    #UnsupportedCanisterCall : icrc21_error_info;
    #ConsentMessageUnavailable : icrc21_error_info;
  };
  public type icrc21_error_info = { description : Text };
  public type Self = actor {
    add_liquidity : shared AddLiquidityArgs -> async AddLiquidityResult;
    add_liquidity_amounts : shared query (
        Text,
        Nat,
        Text,
      ) -> async AddLiquiditAmountsResult;
    add_liquidity_async : shared AddLiquidityArgs -> async AddLiquidityAsyncResult;
    add_pool : shared AddPoolArgs -> async AddPoolResult;
    add_token : shared AddTokenArgs -> async AddTokenResult;
    check_pools : shared () -> async CheckPoolsResult;
    claim : shared Nat64 -> async ClaimResult;
    claims : shared query Text -> async ClaimsResult;
    get_user : shared query () -> async UserResult;
    icrc10_supported_standards : shared query () -> async [
        Icrc10SupportedStandards
      ];
    icrc1_name : shared query () -> async Text;
    icrc21_canister_call_consent_message : shared icrc21_consent_message_request -> async icrc21_consent_message_response;
    icrc28_trusted_origins : shared () -> async Icrc28TrustedOriginsResponse;
    pools : shared query ?Text -> async PoolsResult;
    remove_liquidity : shared RemoveLiquidityArgs -> async RemoveLiquidityResult;
    remove_liquidity_amounts : shared query (
        Text,
        Text,
        Nat,
      ) -> async RemoveLiquidityAmountsResult;
    remove_liquidity_async : shared RemoveLiquidityArgs -> async RemoveLiquidityAsyncResult;
    requests : shared query ?Nat64 -> async RequestsResult;
    send : shared SendArgs -> async SendResult;
    swap : shared SwapArgs -> async SwapResult;
    swap_amounts : shared query (Text, Nat, Text) -> async SwapAmountsResult;
    swap_async : shared SwapArgs -> async SwapAsyncResult;
    tokens : shared query ?Text -> async TokensResult;
    update_token : shared UpdateTokenArgs -> async UpdateTokenResult;
    user_balances : shared query Text -> async UserBalancesResult;
    validate_add_liquidity : shared () -> async ValidateAddLiquidityResult;
    validate_remove_liquidity : shared () -> async ValidateRemoveLiquidityResult;
  }
}