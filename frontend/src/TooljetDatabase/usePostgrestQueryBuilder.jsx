import { useRef, useContext } from 'react';
import PostgrestQueryBuilder from '@/_helpers/postgrestQueryBuilder';
import { tooljetDatabaseService } from '@/_services';
import { isEmpty } from 'lodash';
import { toast } from 'react-hot-toast';
import { TooljetDatabaseContext } from './index';

export const usePostgrestQueryBuilder = ({ organizationId, selectedTable, setSelectedTableData, setTotalRecords }) => {
  const { pageSize } = useContext(TooljetDatabaseContext);

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
          //buildPaginationQuery(pageSize, 0);
        }
      }
    });

    buildPaginationQuery(pageSize, 0);
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
    postgrestQueryBuilder.current.sortQuery = new PostgrestQueryBuilder();

    postgrestQueryBuilder.current.paginationQuery.limit(50);
    postgrestQueryBuilder.current.paginationQuery.offset(0);

    postgrestQueryBuilder.current.filterQuery = new PostgrestQueryBuilder();

    handleBuildSortQuery({});
  };

  const handleRefetchQuery = (filters = {}, sort = {}, currentPage = 1, pageLimit = 50) => {
    // To retain Sort values on Update
    postgrestQueryBuilder.current.sortQuery = new PostgrestQueryBuilder();
    Object.keys(sort).map((key) => {
      if (!isEmpty(sort[key])) {
        const { column, order } = sort[key];
        if (!isEmpty(column) && !isEmpty(order)) {
          postgrestQueryBuilder.current.sortQuery.order(column, order);
        }
      }
    });
    // To retain Filter values on Update
    postgrestQueryBuilder.current.filterQuery = new PostgrestQueryBuilder();
    Object.keys(filters).map((key) => {
      if (!isEmpty(filters[key])) {
        const { column, operator, value } = filters[key];
        if (!isEmpty(column) && !isEmpty(operator) && !isEmpty(value)) {
          postgrestQueryBuilder.current.filterQuery.filter(column, operator, value);
        }
      }
    });

    const offset = currentPage === 1 ? 0 : (currentPage - 1) * pageSize;
    postgrestQueryBuilder.current.paginationQuery.limit(pageLimit);
    postgrestQueryBuilder.current.paginationQuery.offset(offset);

    updateSelectedTableData();
  };

  return {
    handleBuildFilterQuery,
    handleBuildSortQuery,
    buildPaginationQuery,
    resetSortQuery,
    resetFilterQuery,
    resetAll,
    handleRefetchQuery,
  };
};
