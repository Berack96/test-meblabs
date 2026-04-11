import { useTranslation } from 'react-i18next';
import { useState, useEffect, useContext } from 'react';
import { Button, Modal, Tag, Form } from 'antd';
import { faAdd } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import MessageContext from '../helpers/core/MessageContext';

import Table from '../components/core/table/Table';
import ContentPanel from '../components/core/layout/ContentPanel';
import CashFlowApi from '../helpers/api/cashflow';

const Cashflow = () => {
  /* Cose Globali */
  const { t } = useTranslation();
  const { errorMsg: msgErr } = useContext(MessageContext);
  const [loading, setLoading] = useState(false);

  /* Variabili per i dati */
  const [dataSource, setDataSource] = useState([]);
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

  /* Funzioni per CRUD */
  const onCreate = async payload => {
    try {
      const response = await CashFlowApi.create(payload);
      setDataSource(array => [response.data, ...array]);
    } catch (error) {
      msgErr('cashflow-create', error);
    }
  };
  const onUpdate = async (id, payload) => {
    try {
      const response = await CashFlowApi.update(id, payload);
      setDataSource(array => array.map(item => (item._id === id ? response.data : item)));
    } catch (error) {
      msgErr('cashflow-update', error);
    }
  };
  const onDelete = async record => {
    try {
      await CashFlowApi.delete(record._id);
      setDataSource(array => array.filter(item => item._id !== record._id));
    } catch (error) {
      msgErr('cashflow-delete', error);
    }
  };

  /* Modale */
  const form = Form.useForm();
  const openModal = () => {
    Modal.confirm({
      title: t('common.new'),
      okText: t('common.ok'),
      cancelText: t('common.cancel')
    });
  };

  /* Dati iniziali */
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

  /* Pagina */
  return (
    <ContentPanel
      title={t('cashflow.title')}
      titleAction={
        <Button type="primary" icon={<FontAwesomeIcon icon={faAdd} />} onClick={openModal}>
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
      <Modal title={t('cashflow.title')} open={false} />
    </ContentPanel>
  );
};

export default Cashflow;
