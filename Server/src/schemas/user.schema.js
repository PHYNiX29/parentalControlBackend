import { z } from "zod";

export const userRegistrationSchema = z.object({
    username: z.string().min(1).max(20),
    email: z.string().email(),
    github: z.string().min(1).max(100),
    instagram: z.string().min(1).max(100),
    linkedin: z.string().min(1).max(100),
    whatsapp: z.string().min(10).max(13),
    projectsLink: z.string().min(1).max(100),
    designStyle: z.string().min(1).max(100),
    song: z.string().min(1).max(100),
    skills: z.string().min(1).max(100),
    preference1: z.enum(['Tech', 'Management', 'Design']),
    preference2: z.enum(['Tech', 'Management', 'Design']),
    preference3: z.enum(['Tech', 'Management', 'Design']),
});
