import { z } from "zod";

// 1. Базовая схема (то, что мы получаем из БД)
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().nullable().optional(),
  role: z.enum(["USER", "ADMIN"]).default("USER"),
  updatedAt: z.date(),
  createdAt: z.date(),
});

// 2. Схема для авторизации/регистрации
export const LoginInputSchema = UserSchema.pick({
  email: true,
});

// 3. Выводим TypeScript типы из схем
export type User = z.infer<typeof UserSchema>;
export type LoginInput = z.infer<typeof LoginInputSchema>;

// 4. Тип для фронтенда (без чувствительных данных, если бы они были)
export type UserPublic = Omit<User, "somePrivateField">;
