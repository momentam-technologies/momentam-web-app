import React from 'react';
import { CSVLink } from "react-csv";
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import { IconFileSpreadsheet, IconFileJson, IconFilePdf } from '@tabler/icons-react';

const ExportDataButton = ({ data, filename, format, label }) => {
  const exportJSON = () => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    saveAs(blob, `${filename}.json`);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text(JSON.stringify(data, null, 2), 10, 10);
    doc.save(`${filename}.pdf`);
  };

  const getIcon = () => {
    switch (format) {
      case 'csv':
        return <IconFileSpreadsheet size={20} />;
      case 'json':
        return <IconFileJson size={20} />;
      case 'pdf':
        return <IconFilePdf size={20} />;
      default:
        return null;
    }
  };

  const buttonClass = "flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ease-in-out";
  const buttonColors = {
    csv: "bg-green-500 hover:bg-green-600 text-white",
    json: "bg-blue-500 hover:bg-blue-600 text-white",
    pdf: "bg-red-500 hover:bg-red-600 text-white"
  };

  if (format === 'csv') {
    return (
      <CSVLink
        data={data}
        filename={`${filename}.csv`}
        className={`${buttonClass} ${buttonColors[format]}`}
      >
        {getIcon()}
        <span>{label}</span>
      </CSVLink>
    );
  }

  return (
    <button
      onClick={format === 'json' ? exportJSON : exportPDF}
      className={`${buttonClass} ${buttonColors[format]}`}
    >
      {getIcon()}
      <span>{label}</span>
    </button>
  );
};

export default ExportDataButton;
