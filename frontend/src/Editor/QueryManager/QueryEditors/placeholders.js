export const placeholders = {
  mongodb: {
    insert_many: `[
    {
        "_id": 1,
        "name": "Steve"
    },
    {
        "_id": 2,
        "name": "Sally"
    }
]`,

    insert_one: `{ "name": "Steve", "hobbies": [ "hiking", "tennis", "fly fishing" ] }`,
  },
};
