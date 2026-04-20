### Core Principles :-
- Make every change as simple as possible. Impact minimal code.
- Find root causes. No temporary fixes. Senior developer standards.
- Changes should only touch what's necessary. Avoid introducing bugs.
- The name conventions must be readable no shorthand variable name is allowed. And follow the variable naming pattern as well

### Files
- Snowflake index - plugins/packages/snowflake/lib/index.ts
- Query builder - plugins/packages/common/lib/queryBuilder.ts

### Upsert Operation : ( )
- ( Very important point ) - Upsert operation : Update specific column given in input not all the column of a row.

1. No PK columns defined → plain INSERT.
2. All PK values absent/null → IDENTITY auto-gen → INSERT without PK
3. PK values provided → IF EXISTS ... UPDATE ... ELSE ... INSERT
4. Only PK columns present, nothing to update → INSERT if not exists
5. Consider zero records update as success must also consider insert.

- _normalizeBool method to be added for the options ( allow_multiple_updates, zero_records_as_success ). And the default value must be **false**

### Batching of Bulk operations
- Check max params for the database and decide the threshold.
- Bulk Insert, Bulk Upsert, Bulk Update - Must be batched but in a single transaction. Reference ( https://github.com/ToolJet/ToolJet/pull/15908 )
    - Batch lenght must be decided based on number of columns
    - Take reference from mentioned PR.

### Response for Each operation
- Bulk Upsert returns operation name ( sqlCommand:"BULK_UPDATE_BY_KEY" )
- Bulk Insert returns operation name ( sqlCommand:"BATCH INSERT" ) Along with details
- Bulk Update  returns operation name ( sqlCommand:"BULK_UPDATE_BY_KEY" )
- Insert *, Update *, Upsert * - Returns inserted records.