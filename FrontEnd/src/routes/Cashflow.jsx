import { useTranslation } from 'react-i18next';
import { useState, useEffect, useContext } from 'react';
import { Button, Modal, Tag, Form, DatePicker, Input, Radio } from 'antd';
import dayjs from 'dayjs';
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
  const recordCreate = async payload => {
    try {
      const response = await CashFlowApi.create(payload);
      setDataSource(array => [response.data, ...array]);
    } catch (error) {
      msgErr('cashflow-create', error);
    }
  };
  const recordUpdate = async (id, payload) => {
    try {
      const response = await CashFlowApi.update(id, payload);
      setDataSource(array => array.map(item => (item._id === id ? response.data : item)));
    } catch (error) {
      msgErr('cashflow-update', error);
    }
  };
  const recordDelete = async record => {
    try {
      await CashFlowApi.delete(record._id);
      setDataSource(array => array.filter(item => item._id !== record._id));
    } catch (error) {
      msgErr('cashflow-delete', error);
    }
  };

  /* Modale */
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalEdit, setIsModalEdit] = useState(false);
  const [form] = Form.useForm();
  const openModal = (record = null) => {
    setIsModalOpen(true);
    form.resetFields();

    if (record) {
      const recordCopy = { ...record, date: dayjs(record.date) };
      form.setFieldsValue(recordCopy);
      setIsModalEdit(true);
    } else {
      form.setFieldValue('date', dayjs(new Date()));
      form.setFieldValue('type', 'expense');
      setIsModalEdit(false);
    }
  };
  const closeModal = () => {
    setIsModalOpen(false);
    form.resetFields();
  };
  const onModalSubmit = () => {
    form
      .validateFields()
      .then(values => {
        const payload = { ...values, date: values.date.toISOString() };

        if (isModalEdit) {
          recordUpdate(form.getFieldValue('_id'), payload);
        } else {
          recordCreate(payload);
        }

        closeModal();
      })
      .catch(error => {
        msgErr('cashflow-form-validation', error);
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
        <Button type="primary" icon={<FontAwesomeIcon icon={faAdd} />} onClick={() => openModal()}>
          {t('common.new')}
        </Button>
      }
    >
      <Table
        rowKey="_id"
        columns={columns}
        dataSource={dataSource}
        loading={loading}
        onDelete={recordDelete}
        deleteSaveButtonOnRow
        onEdit={record => openModal(record)}
        editCancelButtonOnRow
        pagination={false}
      />
      <Modal title={t('cashflow.form.title')} open={isModalOpen} onCancel={closeModal} onOk={onModalSubmit}>
        <Form form={form} layout="vertical">
          <Form.Item name="date" label={t('cashflow.form.date')} rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item name="type" label={t('cashflow.form.type')} rules={[{ required: true }]}>
            <Radio.Group>
              <Radio value="income">{t('cashflow.type.income')}</Radio>
              <Radio value="expense">{t('cashflow.type.expense')}</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="amount" label={t('cashflow.form.amount')} rules={[{ required: true }]}>
            <Input type="number" step="0.01" />
          </Form.Item>
          <Form.Item name="category" label={t('cashflow.form.category')}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label={t('cashflow.form.description')}>
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </ContentPanel>
  );
};

export default Cashflow;
