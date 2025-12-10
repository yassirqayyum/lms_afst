
export interface User {
    id: string;
    email: string;
    emailVerified: boolean;
    name: string;
    image?: string | null;
    createdAt: Date;
    updatedAt: Date;
    role: "admin" | "trainer" | "trainee";
    approved: boolean;
}
