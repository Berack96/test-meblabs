import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';

import Table from '../components/core/table/Table';
import CashFlowApi from '../helpers/api/cashflow';

const columns = [
  {
    title: 'cashflow.table.date',
    dataIndex: 'date',
    key: 'date'
  },
  {
    title: 'cashflow.table.type',
    dataIndex: 'type',
    key: 'type'
  },
  {
    title: 'cashflow.table.category',
    dataIndex: 'category',
    key: 'category'
  },
  {
    title: 'cashflow.table.amount',
    dataIndex: 'amount',
    key: 'amount'
  }
];

const Cashflow = () => {
  const { t } = useTranslation();
  const translatedColumns = columns.map(col => ({ ...col, title: t(col.title) }));

  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState([]);
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const data = await CashFlowApi.listLatest(30);
        setDataSource(data);
      } catch (error) {
        setDataSource([['foooooo', 'baaar', 'category', 'amount']]);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return <Table columns={translatedColumns} dataSource={dataSource} loading={loading} />;
};

export default Cashflow;
