import { faker } from "@faker-js/faker";
import bcrypt from "bcrypt";
import type { UserAuthData } from "../../shared/types/User.js";
import { pool } from "../src/config/db.config.js";

async function seedUsers(count: number = 50) {
  console.log(`\x1b[33m🚀 Initializing seed for ${count} users...\x1b[0m`);

  // Pre-hash password for speed (Password123!)
  const hashedPassword = await bcrypt.hash("Password123!", 10);

  try {
    for (let i = 0; i < count; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();

      // Constructing a user object that matches UserAuthData
      const newUser: UserAuthData = {
        id: faker.string.uuid(), // Local UUID generation
        name: `${firstName} ${lastName}`,
        email: faker.internet.email({ firstName, lastName }).toLowerCase(),
        password: hashedPassword,
        is_active: faker.datatype.boolean({ probability: 0.8 }), // 80% chance of being active
        is_super_user: false,
        registration_date: faker.date.past().toISOString(),
        last_login: faker.date.recent().toISOString(),
        profile_pic: `https://api.dicebear.com/7.x/adventurer/png?seed=${faker.string.alphanumeric(10)}`,
        last_login_method: faker.helpers.arrayElement([
          "credentials",
          "google",
          "github",
          null,
        ]),

        is_two_factor_enabled: faker.datatype.boolean({ probability: 0.3 }),
        is_deleted: false,

        // Metadata
        last_ip: faker.internet.ipv4(),
        last_browser: faker.helpers.arrayElement([
          "Chrome",
          "Firefox",
          "Safari",
          "Edge",
        ]),
        last_os: faker.helpers.arrayElement([
          "Windows",
          "MacOS",
          "Linux",
          "Android",
          "iOS",
        ]),
        last_device: faker.helpers.arrayElement([
          "Desktop",
          "Mobile",
          "Tablet",
        ]),
        last_location: `${faker.location.city()}, ${faker.location.country()}`,
        last_country: faker.location.country(),
        last_city: faker.location.city(),

        // Auth internals (set to null for fake data)
        verification_code: null,
        verification_code_expiry_time: null,
        reset_password_token: null,
        reset_passsword_token_expiry_time: null,
        oauth_provider: null,
        oauth_id: null,
        oauth_access_token: null,
        oauth_refresh_token: null,
        oauth_token_expires_at: null,
        two_factor_secret: null,
        tmp_two_factor_secret: null,
        disable_2fa_otp: null,
        disable_2fa_otp_expiry_time: null,
        regenerate_2fa_otp: null,
        regenerate_2fa_otp_expiry: null,
      };

      const query = `
        INSERT INTO users (
          id, name, email, password, is_active, is_super_user, 
          registration_date, last_login, profile_pic, last_login_method,
          is_two_factor_enabled, is_deleted, last_ip, last_browser, 
          last_os, last_device, last_location, last_country, last_city
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
        ) ON CONFLICT (email) DO NOTHING;
      `;

      const values = [
        newUser.id,
        newUser.name,
        newUser.email,
        newUser.password,
        newUser.is_active,
        newUser.is_super_user,
        newUser.registration_date,
        newUser.last_login,
        newUser.profile_pic,
        newUser.last_login_method,
        newUser.is_two_factor_enabled,
        newUser.is_deleted,
        newUser.last_ip,
        newUser.last_browser,
        newUser.last_os,
        newUser.last_device,
        newUser.last_location,
        newUser.last_country,
        newUser.last_city,
      ];

      await pool.query(query, values);

      if ((i + 1) % 10 === 0) console.log(`✅ ${i + 1} users injected...`);
    }

    console.log("\x1b[32m✨ Database seeding complete! ✨\x1b[0m");
  } catch (error) {
    console.error("\x1b[31m❌ Seeding failed:\x1b[0m", error);
  } finally {
    await pool.end();
  }
}

seedUsers(50);
