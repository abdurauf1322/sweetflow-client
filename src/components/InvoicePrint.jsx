import React from 'react';
import { formatNumberWithSpaces } from '../utils/format';

export const InvoicePrint = ({ order, store, user }) => {
  if (!order || !store) return null;

  const orderDate = new Date(order.createdAt).toLocaleString('ru-RU', { 
    day: '2-digit', month: '2-digit', year: 'numeric', 
    hour: '2-digit', minute: '2-digit' 
  });
  
  const address = store.address || "Ko'rsatilmagan";
  const agentName = order.createdBy?.name || user?.name || 'Admin';
  const agentPhone = order.createdBy?.phone || user?.username || '';
  
  let totalBoxes = 0;
  let totalItems = 0;

  return (
    <div className="hidden print:block print:w-full bg-white text-black text-sm p-4 print:p-0">
      <div className="text-center font-bold text-lg mb-4 uppercase">Yuk xati (Nakladnoy) ZAKAZ №{order.id.slice(-6)}</div>
      
      {/* Header Info */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
        <div>
          <p><strong>Mijoz (Klient):</strong> {store.name} ({store.ownerName})</p>
          <p><strong>Manzil (Adres):</strong> {address}</p>
          <p><strong>Tel:</strong> {store.phone}</p>
        </div>
        <div>
          <p><strong>Agent (Sotuvchi):</strong> {agentName} ({agentPhone})</p>
          <p><strong>Ekspeditor:</strong> ____________________</p>
          <p><strong>Sana:</strong> {orderDate}</p>
          <p><strong>ZAKAZ raqami:</strong> {order.id}</p>
        </div>
      </div>

      {/* Table */}
      <table className="w-full border-collapse border border-black mb-4 text-xs text-left">
        <thead>
          <tr className="border border-black bg-gray-100">
            <th className="border border-black p-1 w-8 text-center">№</th>
            <th className="border border-black p-1">Mahsulot nomi (Naimenovanie)</th>
            <th className="border border-black p-1 text-center">Blok/Quti</th>
            <th className="border border-black p-1 text-center">Soni (Kol-vo)</th>
            <th className="border border-black p-1 text-right">Narxi (Sena)</th>
            <th className="border border-black p-1 text-right">Summa</th>
          </tr>
        </thead>
        <tbody>
          {order.items?.map((item, index) => {
            const quantityInBox = item.product?.quantityInBox || 1;
            const isBox = item.unitType === 'BOX';
            const boxes = isBox ? item.quantity : 0;
            const pieces = isBox ? (item.quantity * quantityInBox) : item.quantity;
            
            totalBoxes += boxes;
            totalItems += pieces;

            return (
              <tr key={index} className="border border-black">
                <td className="border border-black p-1 text-center">{index + 1}</td>
                <td className="border border-black p-1">
                  {item.product?.name || item.productName || 'Mahsulot'}
                </td>
                <td className="border border-black p-1 text-center">
                  {isBox ? `${boxes} bl.` : '-'}
                </td>
                <td className="border border-black p-1 text-center">
                  {pieces} dona
                </td>
                <td className="border border-black p-1 text-right whitespace-nowrap">
                  {formatNumberWithSpaces(item.price)}
                </td>
                <td className="border border-black p-1 text-right font-bold whitespace-nowrap">
                  {formatNumberWithSpaces(item.totalPrice)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Footer Info */}
      <div className="flex justify-between items-start text-xs font-bold mb-8">
        <div className="space-y-1">
          <p>Jami (Itog): {totalBoxes} blok, {totalItems} dona</p>
          {Number(order.discountAmount) > 0 && (
            <p>Chegirma: {formatNumberWithSpaces(order.discountAmount)} so'm</p>
          )}
          <p className="text-sm">To'lanishi kerak: {formatNumberWithSpaces(order.totalAmount)} so'm</p>
          <div className="mt-2 text-gray-700 font-normal">
            <p>Naqd: {formatNumberWithSpaces((Number(order.totalAmount) || 0) - (Number(order.debtAmount) || 0))} so'm</p>
            <p>Nasiya (Qarz): {formatNumberWithSpaces(order.debtAmount)} so'm</p>
          </div>
        </div>
      </div>

      <div className="flex justify-between text-xs mt-8 pt-4">
        <div>Topshirdi (Otpustil): ____________________</div>
        <div>Qabul qildi (Prinyal): ____________________</div>
      </div>
      
      {/* Print styles global override */}
      <style>{`
        @media print {
          @page { margin: 10mm; }
          body { -webkit-print-color-adjust: exact; background: white !important; }
          body * { visibility: hidden !important; }
          .print\\:block, .print\\:block * { visibility: visible !important; }
          .print\\:block {
             position: absolute !important;
             left: 0 !important;
             top: 0 !important;
             width: 100% !important;
             color: black !important;
          }
        }
      `}</style>
    </div>
  );
};
