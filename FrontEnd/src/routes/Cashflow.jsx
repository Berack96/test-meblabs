import { useTranslation } from 'react-i18next';
import { useState, useEffect, useContext } from 'react';
import { Button, Tag } from 'antd';
import { faAdd } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import MessageContext from '../helpers/core/MessageContext';

import Table from '../components/core/table/Table';
import ContentPanel from '../components/core/layout/ContentPanel';
import CashFlowApi from '../helpers/api/cashflow';

const Cashflow = () => {
  const { t } = useTranslation();
  const { errorMsg: msgErr } = useContext(MessageContext);

  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState([]);

  const onCreate = async payload => {
    const response = await CashFlowApi.create(payload);
    setDataSource(array => [response.data, ...array]);
  };

  const onUpdate = async (id, payload) => {
    const response = await CashFlowApi.update(id, payload);
    setDataSource(array => array.map(item => (item._id === id ? response.data : item)));
  };

  const onDelete = async record => {
    try {
      await CashFlowApi.delete(record._id);
      setDataSource(array => array.filter(item => item._id !== record._id));
    } catch (error) {
      msgErr('cashflow-delete', error);
    }
  };

  const columns = [
    {
      title: t('cashflow.table.date'),
      dataIndex: 'date',
      key: 'date',
      render: value => new Date(value).toLocaleDateString()
    },
    {
      title: t('cashflow.table.type'),
      dataIndex: 'type',
      key: 'type',
      render: value => (
        <div style={{ display: 'flex' }}>
          <Tag color={value === 'income' ? 'green' : 'red'}>{t(`cashflow.type.${value}`)}</Tag>
        </div>
      )
    },
    {
      title: t('cashflow.table.category'),
      dataIndex: 'category',
      key: 'category'
    },
    {
      title: t('cashflow.table.amount'),
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      render: value => `${value.toFixed(2)}`
    }
  ];

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await CashFlowApi.listLatest(30);
        setDataSource(response.data);
      } catch (error) {
        msgErr('cashflow-load', error);
        setDataSource([]);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [msgErr]);

  return (
    <ContentPanel
      title={t('cashflow.title')}
      titleAction={
        <Button type="primary" icon={<FontAwesomeIcon icon={faAdd} />}>
          {t('common.new')}
        </Button>
      }
    >
      <Table
        rowKey="_id"
        columns={columns}
        dataSource={dataSource}
        loading={loading}
        onDelete={onDelete}
        deleteSaveButtonOnRow
        pagination={false}
      />
    </ContentPanel>
  );
};

export default Cashflow;
