import { validate, Validate } from 'class-validator';
import { IsNotExist } from 'src/validators/is-not-exists.validator';
import { plainToInstance } from 'class-transformer';
import { INestApplication } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Organization } from 'src/entities/organization.entity';
import { clearDB, createNestAppInstanceWithEnvMock } from '../test.helper';

/*
  behaves like IsNotExistCaseSensitiveDto when isCaseInsensitive is not specified
*/
class IsNotExistCaseBehaviourNotSpecifiedDto {
  @Validate(IsNotExist, [
    {
      entityClassOrTableName: 'Organization',
      property: 'name',
    },
  ])
  name: string;
}

/*
  uses decorated payload (e.g. 'name') as property when property is not specified in obj
*/
class IsNotExistPropertyNotSpecified /*behaves like IsNotExistCaseSensitiveDto */ {
  @Validate(IsNotExist, [
    {
      entityClassOrTableName: 'Organization',
    },
  ])
  name: string;
}

class IsNotExistCaseInsensitiveDto {
  @Validate(IsNotExist, [
    {
      entityClassOrTableName: 'Organization',
      property: 'name',
      /* should different cases be treated equal */
      isCaseInsensitive: true,
    },
  ])
  name: string;
}

class IsNotExistCaseSensitiveDto {
  @Validate(IsNotExist, [
    {
      entityClassOrTableName: 'Organization',
      property: 'name',
      /* should different cases be treated equal */
      isCaseInsensitive: false,
    },
  ])
  name: string;
}

/*
  would always not pass validation when entityClassOrTableName (to check duplicates of prop) is not specified
*/
class IsNotExistWrongUsage1Dto {
  @Validate(IsNotExist)
  name: string;
}

/*
  would always not pass validation when entityClassOrTableName (to check duplicates of prop) is not existing
*/
class IsNotExistWrongUsage2Dto {
  @Validate(IsNotExist, [
    {
      entityClassOrTableName: 'non-existing-table',
    },
  ])
  name: string;
}

/*
  would always not pass validation when specified prop or fallback decorated prop is not existing on the given entityClassOrTableName
*/
class IsNotExistWrongUsage3Dto {
  @Validate(IsNotExist, [
    {
      entityClassOrTableName: 'Organization',
      property: 'non-existing-prop-on-entity',
    },
  ])
  name: string;
}

describe('IsNotExist Validator', () => {
  let app: INestApplication;
  let orgRepository: Repository<Organization>;
  let existingOrg: Organization;

  beforeAll(async () => {
    ({ app } = await createNestAppInstanceWithEnvMock());
    orgRepository = app.get('OrganizationRepository');
  });

  beforeEach(async () => {
    await clearDB();

    existingOrg = await orgRepository.save(
      orgRepository.create({
        name: 'Workspace A',
        createdAt: new Date(),
        updatedAt: new Date(),
        ssoConfigs: [
          {
            sso: 'form',
          },
        ],
      })
    );
  });

  describe('Common behaviour of isNotExist validator irrespective of case value', () => {
    it('it should accept value of a specified or decorated prop that does not exist on specified entity', async () => {
      const orgName = 'Workspace B';
      const myBodyObject = { name: orgName };

      const myDtoObject1 = plainToInstance(IsNotExistCaseBehaviourNotSpecifiedDto, myBodyObject);
      const myDtoObject2 = plainToInstance(IsNotExistPropertyNotSpecified, myBodyObject);
      const myDtoObject3 = plainToInstance(IsNotExistCaseInsensitiveDto, myBodyObject);
      const myDtoObject4 = plainToInstance(IsNotExistCaseSensitiveDto, myBodyObject);

      const errors1 = await validate(myDtoObject1);
      const errors2 = await validate(myDtoObject2);
      const errors3 = await validate(myDtoObject3);
      const errors4 = await validate(myDtoObject4);

      const errorsArr = [errors1, errors2, errors3, errors4];
      errorsArr.forEach((errors) => {
        expect(errors).toEqual([]);
      });
    });

    it('it should not accept value of a specified or decorated prop that already exists on specified entity', async () => {
      const orgName = existingOrg.name;
      const myBodyObject = { name: orgName };

      const myDtoObject1 = plainToInstance(IsNotExistCaseBehaviourNotSpecifiedDto, myBodyObject);
      const myDtoObject2 = plainToInstance(IsNotExistPropertyNotSpecified, myBodyObject);
      const myDtoObject3 = plainToInstance(IsNotExistCaseInsensitiveDto, myBodyObject);
      const myDtoObject4 = plainToInstance(IsNotExistCaseSensitiveDto, myBodyObject);

      const errors1 = await validate(myDtoObject1);
      const errors2 = await validate(myDtoObject2);
      const errors3 = await validate(myDtoObject3);
      const errors4 = await validate(myDtoObject4);

      const errorsArr = [errors1, errors2, errors3, errors4];
      errorsArr.forEach((errors) => {
        expect(errors).toEqual([
          {
            target: { name: orgName },
            value: orgName,
            property: 'name',
            children: [],
            constraints: { IsNotExist: `${orgName} already exists.` },
          },
        ]);
      });
    });

    it('it would always not pass validation (fail safe) if entityClassOrTableName (to check duplicates of prop) is not specified', async () => {
      const orgName = 'Workspace B';
      const myBodyObject = { name: orgName };
      const existingOrgBodyObject = { name: existingOrg.name };

      const myDtoObject1 = plainToInstance(IsNotExistWrongUsage1Dto, myBodyObject);
      const myDtoObject2 = plainToInstance(IsNotExistWrongUsage1Dto, existingOrgBodyObject);

      const errors1 = await validate(myDtoObject1);
      const errors2 = await validate(myDtoObject2);

      const errorsArr = [
        {
          orgName: orgName,
          errors: errors1,
        },
        {
          orgName: existingOrg.name,
          errors: errors2,
        },
      ];
      errorsArr.forEach(({ orgName, errors }) => {
        expect(errors).toEqual([
          {
            target: { name: orgName },
            value: orgName,
            property: 'name',
            children: [],
            constraints: { IsNotExist: `${orgName} already exists.` },
          },
        ]);
      });
    });

    it('it would always not pass validation (fail safe) if entityClassOrTableName (to check duplicates of prop) is not existing', async () => {
      const orgName = 'Workspace B';
      const myBodyObject = { name: orgName };
      const existingOrgBodyObject = { name: existingOrg.name };

      const myDtoObject1 = plainToInstance(IsNotExistWrongUsage2Dto, myBodyObject);
      const myDtoObject2 = plainToInstance(IsNotExistWrongUsage2Dto, existingOrgBodyObject);

      const errors1 = await validate(myDtoObject1);
      const errors2 = await validate(myDtoObject2);

      const errorsArr = [
        {
          orgName: orgName,
          errors: errors1,
        },
        {
          orgName: existingOrg.name,
          errors: errors2,
        },
      ];
      errorsArr.forEach(({ orgName, errors }) => {
        expect(errors).toEqual([
          {
            target: { name: orgName },
            value: orgName,
            property: 'name',
            children: [],
            constraints: { IsNotExist: `${orgName} already exists.` },
          },
        ]);
      });
    });

    it('it would always not pass validation when specified or decorated prop is not existing on the given entityClassOrTableName', async () => {
      const orgName = 'Workspace B';
      const myBodyObject = { name: orgName };
      const existingOrgBodyObject = { name: existingOrg.name };

      const myDtoObject1 = plainToInstance(IsNotExistWrongUsage3Dto, myBodyObject);
      const myDtoObject2 = plainToInstance(IsNotExistWrongUsage3Dto, existingOrgBodyObject);

      const errors1 = await validate(myDtoObject1);
      const errors2 = await validate(myDtoObject2);

      const errorsArr = [
        {
          orgName: orgName,
          errors: errors1,
        },
        {
          orgName: existingOrg.name,
          errors: errors2,
        },
      ];
      errorsArr.forEach(({ orgName, errors }) => {
        expect(errors).toEqual([
          {
            target: { name: orgName },
            value: orgName,
            property: 'name',
            children: [],
            constraints: { IsNotExist: `${orgName} already exists.` },
          },
        ]);
      });
    });
  });

  describe('IsNotExistCaseInsensitiveDto Usage', () => {
    it('should not accept existing value of specified or decorated prop with different case', async () => {
      const orgName = existingOrg.name.toLowerCase();
      const myBodyObject = { name: orgName };
      const myDtoObject = plainToInstance(IsNotExistCaseInsensitiveDto, myBodyObject);

      const errors = await validate(myDtoObject);

      expect(errors).toEqual([
        {
          target: { name: orgName },
          value: orgName,
          property: 'name',
          children: [],
          constraints: { IsNotExist: `${orgName} already exists.` },
        },
      ]);
    });
  });

  describe('IsNotExistCaseSensitiveDto or default Case Behaviour Usage', () => {
    it('should accept existing value of specified or decorated prop but with different case', async () => {
      const orgName = existingOrg.name.toLowerCase();
      const myBodyObject = { name: orgName };
      const myDtoObject1 = plainToInstance(IsNotExistCaseSensitiveDto, myBodyObject);
      const myDtoObject2 = plainToInstance(IsNotExistCaseBehaviourNotSpecifiedDto, myBodyObject);

      const errors1 = await validate(myDtoObject1);
      const errors2 = await validate(myDtoObject2);

      const errorsArr = [errors1, errors2];
      errorsArr.forEach((errors) => {
        expect(errors).toEqual([]);
      });
    });
  });
});
