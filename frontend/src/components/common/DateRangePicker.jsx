import { useState, forwardRef } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Form, Button, ButtonGroup } from "react-bootstrap";
import "./DateRangePicker.css";

const DateRangePicker = ({ startDate, endDate, onChange, placeholder = "Pilih Periode" }) => {
  const [isOpen, setIsOpen] = useState(false);

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
    setIsOpen(false);
  };

  const CustomHeader = () => (
    <div className="date-picker-presets">
      <ButtonGroup size="sm" className="w-100 mb-2">
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
      <div className="text-center mb-2">
        <small className="text-muted">atau pilih tanggal manual di bawah</small>
      </div>
    </div>
  );

  return (
    <DatePicker
      selected={startDate}
      onChange={(dates) => {
        onChange(dates);
        if (dates[0] && dates[1]) {
          setIsOpen(false);
        }
      }}
      startDate={startDate}
      endDate={endDate}
      selectsRange
      customInput={<CustomInput />}
      dateFormat="dd/MM/yyyy"
      open={isOpen}
      onInputClick={() => setIsOpen(true)}
      onClickOutside={() => setIsOpen(false)}
      monthsShown={2}
      calendarContainer={({ children }) => (
        <div>
          <CustomHeader />
          {children}
        </div>
      )}
    />
  );
};

export default DateRangePicker;
