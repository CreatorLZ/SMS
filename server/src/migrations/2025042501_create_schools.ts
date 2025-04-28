import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('Schools', (table) => {
    table.increments('id').primary();
    table.string('name', 100).notNullable();
    table.string('motto', 255).nullable();
    table.string('contact_info', 255).nullable();
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('Schools');
}
