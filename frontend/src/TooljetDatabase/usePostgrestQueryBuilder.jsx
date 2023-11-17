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
    postgrestQueryBuilder.current.sortQuery = new PostgrestQueryBuilder();
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
    const sortQuery = isEmpty(postgrestQueryBuilder.current.sortQuery.url.toString())
      ? 'order=id.desc'
      : postgrestQueryBuilder.current.sortQuery.url.toString();

    const query =
      postgrestQueryBuilder.current.filterQuery.url.toString() +
      '&' +
      sortQuery +
      '&' +
      postgrestQueryBuilder.current.paginationQuery.url.toString();

    const { headers, data, error } = await tooljetDatabaseService.findOne(organizationId, selectedTable.id, query);

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
    postgrestQueryBuilder.current.filterQuery = new PostgrestQueryBuilder();
    Object.keys(filters).map((key) => {
      if (!isEmpty(filters[key])) {
        const { column, operator, value } = filters[key];
        if (!isEmpty(column) && !isEmpty(operator) && !isEmpty(value)) {
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

  const resetAll = () => {
    console.log('resetAll');
    postgrestQueryBuilder.current.sortQuery = new PostgrestQueryBuilder();

    postgrestQueryBuilder.current.paginationQuery.limit(50);
    postgrestQueryBuilder.current.paginationQuery.offset(0);

    postgrestQueryBuilder.current.filterQuery = new PostgrestQueryBuilder();

    handleBuildSortQuery({});
  };

  return {
    handleBuildFilterQuery,
    handleBuildSortQuery,
    buildPaginationQuery,
    resetSortQuery,
    resetFilterQuery,
    resetAll,
  };
};
