import { API_URL } from "@/lib/api-base";

export interface ChatPermission {
  id: string;
  fromRole: string;
  toRole: string;
  isEnabled: boolean;
}

class ChatConfigService {
  private getToken() {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token") ?? "";
    }
    return "";
  }

  async getPermissions(): Promise<ChatPermission[]> {
    const res = await fetch(`${API_URL}/chat/permissions`, {
      headers: {
        Authorization: `Bearer ${this.getToken()}`,
      },
    });
    if (!res.ok) throw new Error("Failed to fetch chat permissions");
    return res.json();
  }

  async updatePermission(fromRole: string, toRole: string, isEnabled: boolean): Promise<void> {
    const res = await fetch(`${API_URL}/chat/permissions`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.getToken()}`,
      },
      body: JSON.stringify({ fromRole, toRole, isEnabled }),
    });
    if (!res.ok) throw new Error("Failed to update chat permission");
  }
}

export const chatConfigService = new ChatConfigService();
