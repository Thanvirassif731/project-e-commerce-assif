const QuantityPicker = ({ value, max, onChange }) => {
  return (
    <div className="qty-picker">
      <button type="button" onClick={() => onChange(value - 1)} disabled={value <= 1}>
        -
      </button>
      <span>{value}</span>
      <button type="button" onClick={() => onChange(value + 1)} disabled={value >= max}>
        +
      </button>
    </div>
  );
};

export default QuantityPicker;
