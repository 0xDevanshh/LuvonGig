import { getHackathonAgent } from './hackathon-agent';
import { CreateHackathonRequest, CreateParticipantRequest, CreateTeamRequest, CreateRegistrationRequest, Hackathon, Participant, Team, Registration } from './hackathon-agent';

export class HackathonCanister {
  // HACKATHON CRUD OPERATIONS
  static async createHackathon(request: CreateHackathonRequest): Promise<Hackathon> {
    try {
      const agent = await getHackathonAgent();
      const result = await (agent as any).createHackathon(request);

      if (result.ok) {
        return result.ok;
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Error creating hackathon:', error);
      throw error;
    }
  }

  static async getHackathonById(hackathonId: string): Promise<Hackathon> {
    try {
      const agent = await getHackathonAgent();
      const result = await (agent as any).getHackathonById(hackathonId);

      if (result.ok) {
        return result.ok;
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Error getting hackathon:', error);
      throw error;
    }
  }

  static async updateHackathon(hackathonId: string, updatedData: Hackathon): Promise<Hackathon> {
    try {
      const agent = await getHackathonAgent();
      const result = await (agent as any).updateHackathon(hackathonId, updatedData);

      if (result.ok) {
        return result.ok;
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Error updating hackathon:', error);
      throw error;
    }
  }

  static async deleteHackathon(hackathonId: string): Promise<string> {
    try {
      const agent = await getHackathonAgent();
      const result = await (agent as any).deleteHackathon(hackathonId);

      if (result.ok) {
        return result.ok;
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Error deleting hackathon:', error);
      throw error;
    }
  }

  static async listHackathons(limit: number = 10, offset: number = 0): Promise<Hackathon[]> {
    try {
      const agent = await getHackathonAgent();
      const result = await (agent as any).listHackathons(limit, offset);

      if (result.ok) {
        return result.ok;
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Error listing hackathons:', error);
      throw error;
    }
  }

  // PARTICIPANT CRUD OPERATIONS
  static async createParticipant(request: CreateParticipantRequest): Promise<Participant> {
    try {
      const agent = await getHackathonAgent();
      const result = await (agent as any).createParticipant(request);

      if (result.ok) {
        return result.ok;
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Error creating participant:', error);
      throw error;
    }
  }

  static async getParticipantById(participantId: string): Promise<Participant> {
    try {
      const agent = await getHackathonAgent();
      const result = await (agent as any).getParticipantById(participantId);

      if (result.ok) {
        return result.ok;
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Error getting participant:', error);
      throw error;
    }
  }

  static async updateParticipant(participantId: string, updatedData: Participant): Promise<Participant> {
    try {
      const agent = await getHackathonAgent();
      const result = await (agent as any).updateParticipant(participantId, updatedData);

      if (result.ok) {
        return result.ok;
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Error updating participant:', error);
      throw error;
    }
  }

  static async deleteParticipant(participantId: string): Promise<string> {
    try {
      const agent = await getHackathonAgent();
      const result = await (agent as any).deleteParticipant(participantId);

      if (result.ok) {
        return result.ok;
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Error deleting participant:', error);
      throw error;
    }
  }

  static async listParticipants(limit: number = 10, offset: number = 0): Promise<Participant[]> {
    try {
      const agent = await getHackathonAgent();
      const result = await (agent as any).listParticipants(limit, offset);

      if (result.ok) {
        return result.ok;
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Error listing participants:', error);
      throw error;
    }
  }

  // TEAM CRUD OPERATIONS
  static async createTeam(request: CreateTeamRequest): Promise<Team> {
    try {
      const agent = await getHackathonAgent();
      const result = await (agent as any).createTeam(request);

      if (result.ok) {
        return result.ok;
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Error creating team:', error);
      throw error;
    }
  }

  static async getTeamById(teamId: string): Promise<Team> {
    try {
      const agent = await getHackathonAgent();
      const result = await (agent as any).getTeamById(teamId);

      if (result.ok) {
        return result.ok;
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Error getting team:', error);
      throw error;
    }
  }

  static async listTeams(hackathonId: string | null = null, limit: number = 10, offset: number = 0): Promise<Team[]> {
    try {
      const agent = await getHackathonAgent();
      const result = await (agent as any).listTeams(hackathonId, limit, offset);

      if (result.ok) {
        return result.ok;
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Error listing teams:', error);
      throw error;
    }
  }

  // REGISTRATION CRUD OPERATIONS
  static async createRegistration(request: CreateRegistrationRequest): Promise<Registration> {
    try {
      const agent = await getHackathonAgent();
      const result = await (agent as any).createRegistration(request);

      if (result.ok) {
        return result.ok;
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Error creating registration:', error);
      throw error;
    }
  }

  static async getRegistrationById(registrationId: string): Promise<Registration> {
    try {
      const agent = await getHackathonAgent();
      const result = await (agent as any).getRegistrationById(registrationId);

      if (result.ok) {
        return result.ok;
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Error getting registration:', error);
      throw error;
    }
  }

  static async updateRegistrationStatus(registrationId: string, status: any): Promise<Registration> {
    try {
      const agent = await getHackathonAgent();
      const result = await (agent as any).updateRegistrationStatus(registrationId, status);

      if (result.ok) {
        return result.ok;
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Error updating registration status:', error);
      throw error;
    }
  }

  static async listRegistrations(hackathonId: string | null = null, limit: number = 10, offset: number = 0): Promise<Registration[]> {
    try {
      const agent = await getHackathonAgent();
      const result = await (agent as any).listRegistrations(hackathonId, limit, offset);

      if (result.ok) {
        return result.ok;
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Error listing registrations:', error);
      throw error;
    }
  }

  // UTILITY FUNCTIONS
  static async getHackathonStats(): Promise<{
    total_hackathons: number;
    upcoming_hackathons: number;
    ongoing_hackathons: number;
    completed_hackathons: number;
  }> {
    try {
      const agent = await getHackathonAgent();
      const result = await (agent as any).getHackathonStats();

      if (result.ok) {
        return result.ok;
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Error getting hackathon stats:', error);
      throw error;
    }
  }

  static async getParticipantStats(): Promise<{
    total_participants: number;
    total_teams: number;
    total_registrations: number;
  }> {
    try {
      const agent = await getHackathonAgent();
      const result = await (agent as any).getParticipantStats();

      if (result.ok) {
        return result.ok;
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Error getting participant stats:', error);
      throw error;
    }
  }
}