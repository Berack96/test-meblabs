import { useTranslation } from 'react-i18next';
import { useState, useEffect, useContext } from 'react';
import { Button, Modal, Tag, Form, DatePicker, Input, Row, Col, Select, InputNumber } from 'antd';
import dayjs from 'dayjs';
import { faAdd } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import MessageContext from '../helpers/core/MessageContext';

import Table from '../components/core/table/Table';
import ContentPanel from '../components/core/layout/ContentPanel';
import CashFlowApi from '../helpers/api/cashflow';
import { useFilters } from '../components/core/table/Filters';

const Cashflow = () => {
  /* Cose Globali */
  const { t } = useTranslation();
  const { errorMsg: msgErr } = useContext(MessageContext);
  const [loading, setLoading] = useState(false);
  const getTypeTagColor = (value, selected) => {
    if (!selected) return 'default';
    if (value === 'income') return 'green';
    return 'red';
  };

  const typeTag = (value, selected = true) => (
    <Tag color={getTypeTagColor(value, selected)} style={{ marginInlineEnd: 0 }}>
      {t(`cashflow.type.${value}`)}
    </Tag>
  );

  /* Variabili per i dati */
  const [dataSource, setDataSource] = useState([]);
  const [filtersForm] = Form.useForm();
  const [queryFilters, setQueryFilters] = useState({});
  const filters = useFilters('cashflow');
  const onFilterSubmit = () => {
    const values = filtersForm.getFieldsValue();
    values.dateMin = values.dateMin ? values.dateMin.startOf('day').toISOString() : undefined;
    values.dateMax = values.dateMax ? values.dateMax.endOf('day').toISOString() : undefined;
    setQueryFilters(values);
  };
  const onFilterClear = formToClear => {
    filters.onClearFilters(formToClear);
    setQueryFilters({});
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
      render: value => <div style={{ display: 'flex' }}>{typeTag(value)}</div>
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
  const typeValue = Form.useWatch('type', form);
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
        const response = await CashFlowApi.list({ ...queryFilters, sorter: '-date' });
        setDataSource(response.data);
      } catch (error) {
        msgErr('cashflow-load', error);
        setDataSource([]);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [msgErr, queryFilters]);

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
        filters={{
          layout: (
            <Form form={filtersForm} layout="vertical" onFinish={onFilterSubmit}>
              <Form.Item name="type" label={t('cashflow.table.type')}>
                <Select
                  allowClear
                  options={[
                    { value: 'income', label: t('cashflow.type.income') },
                    { value: 'expense', label: t('cashflow.type.expense') }
                  ]}
                />
              </Form.Item>
              <Form.Item name="category" label={t('cashflow.table.category')}>
                <Input allowClear />
              </Form.Item>
              <Row>
                <Col span={12}>
                  <Form.Item name="dateMin" label={t('cashflow.table.date')}>
                    <DatePicker placeholder={t('cashflow.table.dateMin')} format="DD/MM/YYYY" />
                  </Form.Item>
                </Col>
                <Col>
                  <Form.Item name="dateMax" label=" ">
                    <DatePicker placeholder={t('cashflow.table.dateMax')} format="DD/MM/YYYY" />
                  </Form.Item>
                </Col>
              </Row>
              <Row>
                <Col span={12}>
                  <Form.Item name="amountMin" label={t('cashflow.table.amount')}>
                    <InputNumber placeholder={t('cashflow.table.amountMin')} min={0} />
                  </Form.Item>
                </Col>
                <Col>
                  <Form.Item name="amountMax" label=" ">
                    <InputNumber placeholder={t('cashflow.table.amountMax')} min={0} />
                  </Form.Item>
                </Col>
              </Row>
              <Button htmlType="button" block onClick={() => onFilterClear(filtersForm)} style={{ width: '48%' }}>
                {t('common.delete')}
              </Button>
              <Button type="primary" htmlType="submit" block style={{ width: '48%', marginLeft: '2%' }}>
                {t('common.filter')}
              </Button>
            </Form>
          ),
          form: filtersForm,
          showFilter: filters.showFilter,
          onCloseDrawer: filters.onCloseDrawer,
          toggleFilter: filters.toggleFilter,
          filterContainerClasses: filters.filterContainerClasses,
          onClearFilters: onFilterClear,
          hasFilters: filters.hasFilters,
          filterIconClass: filters.filterIconClass
        }}
        onDelete={recordDelete}
        deleteSaveButtonOnRow
        onEdit={record => openModal(record)}
        editCancelButtonOnRow
        pagination={{ pageSize: 20, showSizeChanger: true }}
      />
      <Modal title={t('cashflow.title')} open={isModalOpen} onCancel={closeModal} onOk={onModalSubmit}>
        <Form form={form} layout="horizontal">
          <Row gutter={24}>
            <Col>
              <Form.Item name="date" label={t('cashflow.table.date')} rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col>
              <Form.Item label={t('cashflow.table.type')} required>
                <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                  <button
                    type="button"
                    onClick={() => form.setFieldValue('type', 'income')}
                    style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
                  >
                    {typeTag('income', typeValue === 'income')}
                  </button>
                  <button
                    type="button"
                    onClick={() => form.setFieldValue('type', 'expense')}
                    style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
                  >
                    {typeTag('expense', typeValue === 'expense')}
                  </button>
                </div>
              </Form.Item>
              <Form.Item name="type" hidden rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="amount" label={t('cashflow.table.amount')} rules={[{ required: true }]}>
            <Input type="number" step="0.01" min={0} />
          </Form.Item>
          <Form.Item name="category" label={t('cashflow.table.category')}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label={t('cashflow.table.description')}>
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </ContentPanel>
  );
};

export default Cashflow;
