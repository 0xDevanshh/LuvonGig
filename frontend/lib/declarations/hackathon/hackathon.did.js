export const idlFactory = ({ IDL }) => {
  const HackathonMode = IDL.Variant({
    'Online' : IDL.Null,
    'Offline' : IDL.Null,
    'Hybrid' : IDL.Null,
  });
  const CreateHackathonRequest = IDL.Record({
    'theme' : IDL.Text,
    'title' : IDL.Text,
    'registration_start' : IDL.Text,
    'tagline' : IDL.Text,
    'mode' : HackathonMode,
    'description' : IDL.Text,
    'end_date' : IDL.Text,
    'start_date' : IDL.Text,
    'prize_pool' : IDL.Text,
    'registration_end' : IDL.Text,
    'max_team_size' : IDL.Nat,
    'min_team_size' : IDL.Nat,
    'location' : IDL.Text,
    'rules' : IDL.Text,
  });
  const HackathonStatus = IDL.Variant({
    'Ongoing' : IDL.Null,
    'Cancelled' : IDL.Null,
    'Completed' : IDL.Null,
    'Upcoming' : IDL.Null,
  });
  const HackathonId = IDL.Text;
  const Hackathon = IDL.Record({
    'status' : HackathonStatus,
    'theme' : IDL.Text,
    'title' : IDL.Text,
    'updated_at' : IDL.Text,
    'registration_start' : IDL.Text,
    'tagline' : IDL.Text,
    'mode' : HackathonMode,
    'hackathon_id' : HackathonId,
    'description' : IDL.Text,
    'end_date' : IDL.Text,
    'created_at' : IDL.Text,
    'start_date' : IDL.Text,
    'prize_pool' : IDL.Text,
    'registration_end' : IDL.Text,
    'max_team_size' : IDL.Nat,
    'min_team_size' : IDL.Nat,
    'location' : IDL.Text,
    'rules' : IDL.Text,
  });
  return IDL.Service({
    'createHackathon' : IDL.Func([CreateHackathonRequest], [Hackathon], []),
    'deleteHackathonAsOrganizer' : IDL.Func(
        [IDL.Text, IDL.Text],
        [IDL.Text],
        [],
      ),
    'duplicateHackathon' : IDL.Func([IDL.Text, IDL.Text], [Hackathon], []),
    'getHackathonsByOrganizer' : IDL.Func(
        [IDL.Text, IDL.Nat, IDL.Nat, IDL.Text],
        [IDL.Vec(Hackathon)],
        ['query'],
      ),
    'hello' : IDL.Func([], [IDL.Text], ['query']),
    'listHackathons' : IDL.Func(
        [IDL.Nat, IDL.Nat],
        [IDL.Vec(Hackathon)],
        ['query'],
      ),
    'updateHackathonStatus' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text],
        [Hackathon],
        [],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
