import { useState, forwardRef } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Form, Button, ButtonGroup, Dropdown } from "react-bootstrap";
import "./DateRangePicker.css";

const DateRangePicker = ({ startDate, endDate, onChange, placeholder = "Pilih Periode" }) => {
  const [showCalendar, setShowCalendar] = useState(false);

  const CustomInput = forwardRef(({ value, onClick }, ref) => (
    <Form.Control
      size="sm"
      onClick={onClick}
      ref={ref}
      value={value}
      readOnly
      placeholder={placeholder}
      style={{ 
        minWidth: "200px", 
        cursor: "pointer",
        backgroundColor: "white"
      }}
    />
  ));

  const setQuickDateRange = (type) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (type) {
      case 'today':
        onChange([today, today]);
        break;
      case 'this_month':
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        onChange([startOfMonth, today]);
        break;
      case 'all':
        onChange([null, null]);
        break;
    }
  };

  return (
    <Dropdown>
      <Dropdown.Toggle variant="outline-primary" size="sm" style={{ minWidth: "200px" }}>
        {startDate && endDate
          ? `${startDate.toLocaleDateString('id-ID')} - ${endDate.toLocaleDateString('id-ID')}`
          : startDate || endDate
          ? startDate?.toLocaleDateString('id-ID') || endDate?.toLocaleDateString('id-ID')
          : placeholder}
      </Dropdown.Toggle>

      <Dropdown.Menu style={{ padding: "15px", minWidth: "300px" }}>
        <div className="mb-3">
          <ButtonGroup size="sm" className="w-100">
            <Button variant="outline-primary" onClick={() => setQuickDateRange('today')}>
              Hari Ini
            </Button>
            <Button variant="outline-primary" onClick={() => setQuickDateRange('this_month')}>
              Bulan Ini
            </Button>
            <Button variant="outline-secondary" onClick={() => setQuickDateRange('all')}>
              Semua
            </Button>
          </ButtonGroup>
        </div>
        <div className="text-center mb-2">
          <small className="text-muted">atau pilih tanggal manual:</small>
        </div>
        <DatePicker
          selected={startDate}
          onChange={(dates) => onChange(dates)}
          startDate={startDate}
          endDate={endDate}
          selectsRange
          inline
          monthsShown={2}
        />
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default DateRangePicker;
