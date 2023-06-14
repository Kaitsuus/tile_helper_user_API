
# APU-App User API

This is a Tile helper aka.(APU-App) User API built with Node.js, Express, and MongoDB. It provides basic CRUD (Create, Read, Update, Delete) operations for managing user data.

## Folder Structure

The project has the following folder structure:

- `Controllers`: Contains the controller files responsible for handling API routes and business logic.
- `models`: Includes the database models representing the user schema and defining interactions with the MongoDB database.
- `requests`: Consists of request validation files or middleware to validate incoming requests.
- `tests`: Contains test files for unit testing the API endpoints and functionality.
- `utils`: Includes utility files or helper functions used throughout the project.
- `app.js`: The main file where the Express application is initialized and configured.
- `index.js`: The entry point of the application that starts the server and connects to the MongoDB database.

## Getting Started

To get started with the API, follow these steps:

1. Clone the repository: `git clone <repository_url>`
2. Install the dependencies: `npm install`
3. Ask for environment variables
4. Start the server: `nmp start`
5. The API will be accessible at `http://localhost:3003`.

## API Endpoints

The API provides the following endpoints:

- `POST /api/login`: Endpoint for user login. It authenticates the user and generates a token for accessing protected routes.
- `GET /api/users`: Get a list of all users.
- `GET /api/users/:id`: Get a specific user by their ID.
- `POST /api/users`: Create a new user.
- `PUT /api/users/:id`: Update an existing user.
- `DELETE /api/users/:id`: Delete a user.
- `GET /api/lists`: Get a list of all lists (requires authentication).
- `GET /api/lists/:id`: Get a specific list by its ID (requires authentication).
- `POST /api/lists`: Create a new list (requires authentication).
- `PUT /api/lists/:id`: Update an existing list (requires authentication).
- `DELETE /api/lists/:id`: Delete a list (requires authentication).

Please note that the `userExtractor` middleware is used to extract and authenticate the user from the incoming request. The protected routes (`/api/users`, `/api/lists`) require authentication, while the login route (`/api/login`) does not.

For detailed information about each endpoint, inspect the corresponding router files (`loginRouter.js`, `usersRouter.js`, `listsRouter.js`) in the respective folders.


## Testing

The API includes a suite of unit tests located in the `tests` folder. You can run the tests using the following command:

```
npm test
```

The tests use a test database and should not affect your production data. However, ensure that you have a separate MongoDB instance for testing purposes.

## Contributing

Contributions to this project are welcome! If you find any issues or have suggestions for improvements, please open an issue or submit a pull request.

## License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT).
