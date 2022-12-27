import { useRef } from 'react';
import PostgrestQueryBuilder from '@/_helpers/postgrestQueryBuilder';
import { tooljetDatabaseService } from '@/_services';
import { isEmpty } from 'lodash';
import { toast } from 'react-hot-toast';

export const usePostgrestQueryBuilder = ({ organizationId, selectedTable, setSelectedTableData, setTotalRecords }) => {
  const postgrestQueryBuilder = useRef({
    filterQuery: new PostgrestQueryBuilder(),
    sortQuery: new PostgrestQueryBuilder(),
    paginationQuery: new PostgrestQueryBuilder(),
  });

  const handleBuildSortQuery = (filters) => {
    Object.keys(filters).map((key) => {
      if (!isEmpty(filters[key])) {
        const { column, order } = filters[key];
        if (!isEmpty(column) && !isEmpty(order)) {
          postgrestQueryBuilder.current.sortQuery.order(column, order);
        }
      }
    });
    updateSelectedTableData();
  };

  const updateSelectedTableData = async () => {
    const query =
      postgrestQueryBuilder.current.filterQuery.url.toString() +
      '&' +
      postgrestQueryBuilder.current.sortQuery.url.toString() +
      '&' +
      postgrestQueryBuilder.current.paginationQuery.url.toString();

    const { headers, data, error } = await tooljetDatabaseService.findOne(organizationId, selectedTable, query);

    if (error) {
      toast.error(error?.message ?? 'Something went wrong');
      return;
    }

    const totalRecords = headers['content-range'].split('/')[1] || 0;

    if (Array.isArray(data)) {
      setTotalRecords(totalRecords);
      setSelectedTableData(data);
    }
  };

  const handleBuildFilterQuery = (filters) => {
    Object.keys(filters).map((key) => {
      if (!isEmpty(filters[key])) {
        const { column, operator, value } = filters[key];
        if (!isEmpty(column) && !isEmpty(operator) && !isEmpty(value)) {
          const currentFilterQuery = postgrestQueryBuilder.current.filterQuery.url.toString();

          if (currentFilterQuery.includes(column)) {
            const filterQuery = new PostgrestQueryBuilder();
            filterQuery.filter(column, operator, value);
            postgrestQueryBuilder.current.filterQuery = filterQuery;
            return;
          }

          postgrestQueryBuilder.current.filterQuery.filter(column, operator, value);
        }
      }
    });

    updateSelectedTableData();
  };

  const buildPaginationQuery = (limit, offset) => {
    postgrestQueryBuilder.current.paginationQuery.limit(limit);
    postgrestQueryBuilder.current.paginationQuery.offset(offset);

    updateSelectedTableData();
  };

  const resetSortQuery = () => {
    postgrestQueryBuilder.current.sortQuery = new PostgrestQueryBuilder();
    postgrestQueryBuilder.current.paginationQuery.limit(50);
    postgrestQueryBuilder.current.paginationQuery.offset(0);
    handleBuildSortQuery({});
  };

  const resetFilterQuery = () => {
    postgrestQueryBuilder.current.filterQuery = new PostgrestQueryBuilder();
    postgrestQueryBuilder.current.paginationQuery.limit(50);
    postgrestQueryBuilder.current.paginationQuery.offset(0);
    handleBuildFilterQuery({});
  };

  return {
    handleBuildFilterQuery,
    handleBuildSortQuery,
    buildPaginationQuery,
    resetSortQuery,
    resetFilterQuery,
  };
};
