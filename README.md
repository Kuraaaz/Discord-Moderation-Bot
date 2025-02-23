# Discord Moderation Bot

This project is a Discord bot designed for moderation purposes, built using `discord.js` and `MySQL` for data storage. The bot can manage members, track server information, and perform various moderation tasks.

## Features

- Moderation commands for managing members and servers.
- Event handling for various Discord API events.
- MySQL database integration for storing server and member data.
- Utility functions for common tasks.

## Project Structure

```
discord-moderation-bot
├── src
│   ├── bot.js               # Main entry point for the bot
│   ├── commands             # Contains command definitions
│   │   └── all commands
│   ├── events               # Contains event handlers
│   │   └── all events
│   ├── database             # Database connection setup
│   │   └── connection.js (for sql connection)
│   └── utils                # Utility functions
│       └── helpers.js
├── package.json             # npm configuration file
├── .env                     # Environment variables
└── README.md                # Project documentation
```

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/Kuraaaz/Discord-Moderation-Bot.git
   ```

2. Navigate to the project directory:
   ```
   cd Discord-Moderation-Bot
   ```

3. Install the dependencies:
   ```
   npm i
   ```

4. Create a `.env` file in the root directory and add your Discord bot token and MySQL credentials:
   ```
   DISCORD_TOKEN=your_bot_token
   DB_HOST=your_database_host
   DB_USER=your_database_user
   DB_PASSWORD=your_database_password
   DB_NAME=your_database_name
   ```

5. Run the bot:
   ```
   node index.js
   ```

## Usage

Once the bot is running, it will join the servers it has been invited to and will be able to respond to moderation commands defined in the `src/commands/index.js` file. You can customize the commands and events as needed.

## Contributing

Feel free to submit issues or pull requests if you have suggestions or improvements for the bot!
