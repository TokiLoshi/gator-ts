# Gator

Gator is a blog aggregator you can run from your terminal.

## Getting started

1. To get started for the repo and clone it into your local repositotry, then run `npm install`.
2. Create a gatorconfig.json file in a your home directory: `~/.gatorconfig.json` with the following structure:

````{
  "db_url": "connection_string_goes_here",
  "current_user_name": "username_goes_here"
}```
````

3. Ensure you have postgresql@16 installed and create a new database, this project used the name "gator".
4. Update your db_url in your config file with your connection string
5. Initialize the database

## Commands

Run the commands the following `npm run start <commandName> <args>`

| Command  | Arguments    | Description                                                                |
| -------- | ------------ | -------------------------------------------------------------------------- |
| register | <username>   | Register a new user                                                        |
| login    | <username>   | Log in as a user                                                           |
| reset    |              | Reset the database                                                         |
| users    |              | List all users                                                             |
| agg      | <duration>   | Aggregate posts followed from feeds. Durtion examples: 10ms, 10s, 10m, 10h |
| addfeed  | <name> <url> | Add a new feed                                                             |
| follow   | <feedurl>    | Follow a feed                                                              |
| unfollow | <feedurl>    | Unfollow a feed                                                            |
| browse   | <limit>      | Show latest posts from followed feeds                                      |

## Examples

### register and login

- npm run start register booties

- npm run start login booties

### add and follow feeds

- npm run start addfeed "Best Blog Ever" https://example.com/feed.xml
- npm run start follow https://example.com/feed.xml

### aggregate posts every hour

- npm run start agg 1h

### browse latest 10 posts

- npm run brows 10
