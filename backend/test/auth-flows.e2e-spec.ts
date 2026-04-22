import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { User } from '../src/entities/user.entity';
import {
  beforeAll,
  afterAll,
  beforeEach,
  describe,
  expect,
  it,
} from '@jest/globals';

/**
 * Uses Gmail plus-addressing so mail still arrives at the same inbox:
 * nhuttran12102000@gmail.com, minhlinhvn67@gmail.com
 *
 * Requires: Postgres, Redis (Bull), valid BREVO_API_KEY (xkeysib-...) in .env
 * REQUIRE_EMAIL_VERIFICATION=false for instant /auth/register/applicant
 */
describe('Auth flows (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  const emailNhut = 'nhuttran12102000+hrflowtest@gmail.com';
  const emailMinh = 'minhlinhvn67+hrflowtest@gmail.com';
  const passwordInitial = 'TestPass1!';
  const passwordReset = 'TestPass2!';

  async function removeUserByEmail(email: string): Promise<void> {
    // Clean by email first to avoid leftovers causing unique email conflicts.
    try {
      await dataSource.query(`DELETE FROM applicants WHERE LOWER(email) = LOWER($1)`, [
        email,
      ]);
    } catch {
      /* table/column may differ in older schemas */
    }
    const rows: { id: number }[] = await dataSource.query(
      `SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [email],
    );
    if (!rows?.length) return;
    const userId = rows[0].id;
    for (const sql of [
      `DELETE FROM applicants WHERE "userId" = $1`,
      `DELETE FROM applicants WHERE user_id = $1`,
    ]) {
      try {
        await dataSource.query(sql, [userId]);
      } catch {
        /* column name may differ */
      }
    }
    for (const sql of [
      `DELETE FROM employees WHERE "userId" = $1`,
      `DELETE FROM employees WHERE user_id = $1`,
    ]) {
      try {
        await dataSource.query(sql, [userId]);
      } catch {
        /* optional */
      }
    }
    try {
      await dataSource.query(
        `DELETE FROM signup_verifications WHERE LOWER(email) = LOWER($1)`,
        [email],
      );
    } catch {
      /* table may be absent in some DBs */
    }
    await dataSource.query(`DELETE FROM users WHERE id = $1`, [userId]);
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
    dataSource = app.get(DataSource);
  }, 60_000);

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      await removeUserByEmail(emailNhut);
      await removeUserByEmail(emailMinh);
    }
    if (app) await app.close();
  });

  beforeEach(async () => {
    await removeUserByEmail(emailNhut);
    await removeUserByEmail(emailMinh);
  });

  it('POST /api/auth/register/applicant + login (nhuttran…)', async () => {
    const reg = await request(app.getHttpServer())
      .post('/api/auth/register/applicant')
      .send({
        fullName: 'E2E Nhut',
        email: emailNhut,
        password: passwordInitial,
      })
      .expect(201);

    expect(reg.body.data?.email ?? reg.body.data).toBeTruthy();

    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: emailNhut,
        password: passwordInitial,
        portal: 'applicant',
      })
      .expect(202);

    expect(login.body.data?.access_token).toBeDefined();
    expect(login.body.data?.user?.email).toBe(emailNhut.toLowerCase());
  });

  it('POST /api/auth/forgot-password + reset-password + login (minhlinh…)', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register/applicant')
      .send({
        fullName: 'E2E Minh',
        email: emailMinh,
        password: passwordInitial,
      })
      .expect(201);

    const forgot = await request(app.getHttpServer())
      .post('/api/auth/forgot-password')
      .send({ email: emailMinh })
      .expect(200);

    expect(forgot.body.message).toBeDefined();

    const userRepo = dataSource.getRepository(User);
    const row = await userRepo.findOne({
      where: { email: emailMinh.toLowerCase() },
    });
    expect(row?.resetPasswordToken).toBeTruthy();
    const token = row!.resetPasswordToken!;

    await request(app.getHttpServer())
      .post('/api/auth/reset-password')
      .send({
        token,
        newPassword: passwordReset,
      })
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: emailMinh,
        password: passwordInitial,
        portal: 'applicant',
      })
      .expect(401);

    const loginOk = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: emailMinh,
        password: passwordReset,
        portal: 'applicant',
      })
      .expect(202);

    expect(loginOk.body.data?.access_token).toBeDefined();
  });

  it('POST /api/auth/register (legacy) + verify shape', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        fullName: 'Legacy Reg',
        email: emailNhut,
        password: passwordInitial,
        phone: '0123456789',
      })
      .expect(201);

    expect(res.body.data).toBeDefined();
  });
});

/** Set E2E_LIVE_MAIL=true to hit Brevo and send real messages to these inboxes. */
describe('Live Brevo → Gmail (optional)', () => {
  const run = process.env.E2E_LIVE_MAIL === 'true' ? it : it.skip;
  let app: INestApplication;
  let dataSource: DataSource;

  const nhut = 'nhuttran12102000@gmail.com';
  const minh = 'minhlinhvn67@gmail.com';
  const pass = 'LiveTest1!';

  async function wipe(email: string) {
    // Live mail tests may run against reused DBs, so remove by email first.
    try {
      await dataSource.query(`DELETE FROM applicants WHERE LOWER(email) = LOWER($1)`, [
        email,
      ]);
    } catch {
      /* ignore */
    }
    const rows: { id: number }[] = await dataSource.query(
      `SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [email],
    );
    if (!rows?.length) return;
    const userId = rows[0].id;
    for (const sql of [
      `DELETE FROM applicants WHERE "userId" = $1`,
      `DELETE FROM applicants WHERE user_id = $1`,
    ]) {
      try {
        await dataSource.query(sql, [userId]);
      } catch {
        /* ignore */
      }
    }
    try {
      await dataSource.query(
        `DELETE FROM signup_verifications WHERE LOWER(email) = LOWER($1)`,
        [email],
      );
    } catch {
      /* ignore */
    }
    await dataSource.query(`DELETE FROM users WHERE id = $1`, [userId]);
  }

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
    dataSource = app.get(DataSource);
  }, 60_000);

  afterAll(async (): Promise<void> => {
    if (dataSource?.isInitialized) {
      await wipe(nhut);
      await wipe(minh);
    }
    if (app) await app.close();
  });

  run(
    'POST forgot-password sends mail to nhuttran12102000@gmail.com',
    async () => {
      await wipe(nhut);
      await request(app.getHttpServer())
        .post('/api/auth/register/applicant')
        .send({ fullName: 'Live Nhut', email: nhut, password: pass })
        .expect(201);
      const res = await request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({ email: nhut })
        .expect(200);
      expect(res.body.message).toBeDefined();
    },
  );

  run('POST forgot-password sends mail to minhlinhvn67@gmail.com', async () => {
    await wipe(minh);
    await request(app.getHttpServer())
      .post('/api/auth/register/applicant')
      .send({ fullName: 'Live Minh', email: minh, password: pass })
      .expect(201);
    const res = await request(app.getHttpServer())
      .post('/api/auth/forgot-password')
      .send({ email: minh })
      .expect(200);
    expect(res.body.message).toBeDefined();
  });
});
