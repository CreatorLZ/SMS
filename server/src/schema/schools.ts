import { mysqlTable, int, varchar, timestamp } from "drizzle-orm/mysql-core";

export const schools = mysqlTable("Schools", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 100 }).notNull(),
  motto: varchar("motto", { length: 255 }),
  contactInfo: varchar("contact_info", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
