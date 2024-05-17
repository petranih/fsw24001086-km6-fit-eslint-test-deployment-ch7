const dotenv = require("dotenv");
dotenv.config();

const request = require("supertest");
const app = require("../../app");
const jwt = require("jsonwebtoken");

describe("[API AUTH LOGIN TESTS]", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("Success login", async () => {
    const credential = {
      email: "brian@binar.co.id",
      password: "123456",
    };

    const response = await request(app).post("/v1/auth/login").send(credential);

    expect(response.statusCode).toBe(201);
    expect(response.body.accessToken).not.toBeNull();
  });

  test("Failed login - Wrong Password", async () => {
    const credential = {
      email: "brian@binar.co.id",
      password: "jasndjasndjas",
    };

    const response = await request(app).post("/v1/auth/login").send(credential);

    expect(response.statusCode).toBe(401);
    expect(response.body.error.name).toBe("Error");
    expect(response.body.error.message).toBe("Password is not correct!");
  });

  test("Failed login - Unregistered Email", async () => {
    const credential = {
      email: "brianzzz@binar.co.id",
      password: "jasndjasndjas",
    };

    const response = await request(app).post("/v1/auth/login").send(credential);

    expect(response.statusCode).toBe(404);
    expect(response.body.error.name).toBe("Error");
    expect(response.body.error.message).toBe(
      `${credential.email} is not registered!`
    );
    expect(response.body.error.details.email).toBe(`${credential.email}`);
  });
});

describe("[API AUTH REGISTER TESTS]", () => {
  test("Success register", async () => {
    const randomizeCredential = ({ name, password }) => {
      const simplifiedName = name.replace(/\s+/g, "").toLowerCase();

      const generateRandomString = (length) => {
        const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
        let result = "";
        for (let i = 0; i < length; i++) {
          const randomIndex = Math.floor(Math.random() * chars.length);
          result += chars[randomIndex];
        }
        return result;
      };

      const randomStringLength = 6;
      const randomString = generateRandomString(randomStringLength);

      const randomEmail = `${simplifiedName}_${randomString}@gmail.com`;

      return {
        name,
        email: randomEmail,
        password,
      };
    };

    const credential = {
      name: "Akbar Rahmat Mulyatama",
      email: "akbarrahmatm@gmail.com",
      password: "akbarganteng",
    };

    const newCredential = randomizeCredential(credential);

    const response = await request(app)
      .post("/v1/auth/register")
      .send(newCredential);

    expect(response.statusCode).toBe(201);
    expect(response.body.accessToken).not.toBeNull();
  });

  test("Failed register - Email exist", async () => {
    const credential = {
      email: "brian@binar.co.id",
      password: "123456",
    };

    const response = await request(app)
      .post("/v1/auth/register")
      .send(credential);

    expect(response.statusCode).toBe(422);
    expect(response.body.error.name).toBe("Error");
    expect(response.body.error.message).toBe(
      `${credential.email} is already taken!`
    );
    expect(response.body.error.details.email).toBe(`${credential.email}`);
  });
});

describe("[API AUTH GET USER TEST]", () => {
  let authToken;

  beforeAll(async () => {
    const response = await request(app)
      .post("/v1/auth/login")
      .send({ email: "akbarrahmatm@binar.co.id", password: "123456" });

    authToken = response.body.accessToken;
  });

  test("Get User Check", async () => {
    const response = await request(app)
      .get("/v1/auth/whoami")
      .set("Authorization", `Bearer ${authToken}`);
    expect(response.statusCode).toBe(200);
    expect(response.body).not.toBeNull;
  });

  test("Get User Check - No Token Provided", async () => {
    const response = await request(app).get("/v1/auth/whoami");
    expect(response.statusCode).toBe(401);
    expect(response.body.error).not.toBeNull;
    expect(response.body.error.name).toBe("JsonWebTokenError");
    expect(response.body.error.message).toBe("jwt must be provided");
  });

  test("Get User Check - Wrong Token", async () => {
    const response = await request(app)
      .get("/v1/auth/whoami")
      .set("Authorization", "Bearer ngasal");
    expect(response.statusCode).toBe(401);
    expect(response.body.error).not.toBeNull;
    expect(response.body.error.name).toBe("JsonWebTokenError");
    expect(response.body.error.message).toBe("jwt malformed");
  });

  test("Get User Check - Token Provided, But Payload Role Is Not Valid", async () => {
    let token = jwt.sign(
      {
        id: "",
        name: "",
        email: "",
        role: "",
      },
      process.env.JWT_SIGNATURE_KEY
    );

    const response = await request(app)
      .get("/v1/auth/whoami")
      .set("Authorization", `Bearer ${token}`);
    expect(response.statusCode).toBe(401);
    expect(response.body.error).not.toBeNull;
    expect(response.body.error.name).toBe("Error");
    expect(response.body.error.message).toBe("Access forbidden!");
  });

  test("Get User Check - Token Provided & Payload Is Valid, But ID User Unexpectedly Modified", async () => {
    let token = jwt.sign(
      {
        id: 622, // This is invalid id
        name: "Brian",
        email: "brian@binar.co.id",
        image: null,
        role: {
          id: "1",
          name: "CUSTOMER",
        },
      },
      process.env.JWT_SIGNATURE_KEY
    );

    const response = await request(app)
      .get("/v1/auth/whoami")
      .set("Authorization", `Bearer ${token}`);
    expect(response.statusCode).toBe(404);
    expect(response.body.error).not.toBeNull;
    expect(response.body.error.name).toBe("Error");
    expect(response.body.error.message).toBe("User not found!");
  });
});
