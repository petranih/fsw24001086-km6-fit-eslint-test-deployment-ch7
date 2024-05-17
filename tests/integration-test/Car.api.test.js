const dotenv = require("dotenv");
dotenv.config();

const request = require("supertest");
const app = require("../../app");

describe("[API CAR TESTS]", () => {
  test("Success Get All Cars Data", async () => {
    const response = await request(app).get("/v1/cars");

    expect(response.statusCode).toBe(200);
    expect(response.body.cars).not.toBeNull();
  });

  test("Success Get Car Data By ID", async () => {
    const id = 385;
    const response = await request(app).get(`/v1/cars/${id}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.cars).not.toBeNull();
  });
});

describe("[API CAR ADMIN TESTS]", () => {
  let authToken;
  let authCustomer;

  beforeAll(async () => {
    const response = await request(app)
      .post("/v1/auth/login")
      .send({ email: "brian@binar.co.id", password: "123456" });

    authToken = response.body.accessToken;
  });

  beforeAll(async () => {
    const response = await request(app)
      .post("/v1/auth/login")
      .send({ email: "akbarrahmatm@binar.co.id", password: "123456" });

    authCustomer = response.body.accessToken;
  });

  test("Success Create New Data", async () => {
    const data = {
      name: "Toyota Innova",
      price: 200000000,
      size: "LARGE",
      image: "https://source.unsplash.com/1920x1080",
    };

    const response = await request(app)
      .post(`/v1/cars`)
      .send(data)
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.statusCode).toBe(201);
    expect(response.body).not.toBeNull();
    expect(response.body.id).not.toBeNull();
    expect(response.body.name).not.toBeNull();
    expect(response.body.price).not.toBeNull();
    expect(response.body.size).not.toBeNull();
    expect(response.body.image).not.toBeNull();
    expect(response.body.isCurrentlyRented).not.toBeNull();
    expect(response.body.updatedAt).not.toBeNull();
    expect(response.body.createdAt).not.toBeNull();
  });

  test("Failed Create New Data - No Token Provided", async () => {
    const data = {
      name: "Toyota Innova",
      price: 200000000,
      size: "LARGE",
      image: "https://source.unsplash.com/1920x1080",
    };

    const response = await request(app).post(`/v1/cars`).send(data);

    expect(response.statusCode).toBe(401);
    expect(response.body).not.toBeNull();
    expect(response.body.error.name).toBe("JsonWebTokenError");
    expect(response.body.error.message).toBe("jwt must be provided");
    expect(response.body.error.details).toBe(null);
  });

  test("Failed Create New Data - User role is invalid", async () => {
    const data = {
      name: "Toyota Innova",
      price: 200000000,
      size: "LARGE",
      image: "https://source.unsplash.com/1920x1080",
    };

    const response = await request(app)
      .post(`/v1/cars`)
      .send(data)
      .set("Authorization", `Bearer ${authCustomer}`);

    expect(response.statusCode).toBe(401);
    expect(response.body).not.toBeNull();
    expect(response.body.error.name).toBe("Error");
    expect(response.body.error.message).toBe("Access forbidden!");
  });

  test("Failed Create New Data - Unexpected Request Body", async () => {
    const data = {
      name: null,
      price: 200000000,
      size: "LARGE",
      image: "https://source.unsplash.com/1920x1080",
    };

    const response = await request(app)
      .post(`/v1/cars`)
      .send(data)
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.statusCode).toBe(422);
    expect(response.body).not.toBeNull();
    expect(response.body.error.name).toBe("Error");
    expect(response.body.error.message).toBe("Name should be provided");
  });
});

describe("[API CAR USERS TESTS]", () => {
  let authToken;
  let authAdmin;

  beforeAll(async () => {
    const response = await request(app)
      .post("/v1/auth/login")
      .send({ email: "akbarrahmatm@binar.co.id", password: "123456" });

    authToken = response.body.accessToken;
  });

  beforeAll(async () => {
    const response = await request(app)
      .post("/v1/auth/login")
      .send({ email: "brian@binar.co.id", password: "123456" });

    authAdmin = response.body.accessToken;
  });

  test("Success rent car", async () => {
    const carId = 389;
    const data = {
      rentStartedAt: "2024-05-15T03:58:20+0700",
      rentEndedAt: "2024-05-17T03:58:20+0700",
    };

    const response = await request(app)
      .post(`/v1/cars/${carId}/rent`)
      .send(data)
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.statusCode).toBe(201);
    expect(response.body).not.toBeNull();
  });

  test("Failed rent car - Role is not Customer", async () => {
    const carId = 387;
    const data = {
      rentStartedAt: "2024-05-15T03:58:20+0700",
      rentEndedAt: "2024-05-17T03:58:20+0700",
    };

    const response = await request(app)
      .post(`/v1/cars/${carId}/rent`)
      .send(data)
      .set("Authorization", `Bearer ${authAdmin}`);

    expect(response.statusCode).toBe(401);
    expect(response.body.error.name).toBe("Error");
    expect(response.body.error.message).toBe("Access forbidden!");
    expect(response.body.error.details.role).toBe("ADMIN");
    expect(response.body.error.details.reason).toBe(
      "ADMIN is not allowed to perform this operation."
    );
  });

  test("Failed rent car - Car is already rented", async () => {
    const carId = 387;
    const data = {
      rentStartedAt: "2024-05-15T03:58:20+0700",
      rentEndedAt: "2024-05-17T03:58:20+0700",
    };

    const response = await request(app)
      .post(`/v1/cars/${carId}/rent`)
      .send(data)
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.statusCode).toBe(422);
    expect(response.body.error).not.toBeNull();
  });
});
