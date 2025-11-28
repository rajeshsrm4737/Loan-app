import { useState } from 'react';
import { calculateEMI, generateRepaymentSchedule } from '../lib/emiCalculator';
import Layout from '../components/Layout';
import { Calculator, Calendar } from 'lucide-react';

export default function EMICalculator() {
  const [principal, setPrincipal] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [tenure, setTenure] = useState('');
  const [result, setResult] = useState<any>(null);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [showSchedule, setShowSchedule] = useState(false);

  const handleCalculate = () => {
    const p = parseFloat(principal);
    const r = parseFloat(interestRate);
    const t = parseInt(tenure);

    if (isNaN(p) || isNaN(r) || isNaN(t) || p <= 0 || t <= 0) {
      alert('Please enter valid values');
      return;
    }

    const calculation = calculateEMI(p, r, t);
    setResult(calculation);

    const repaymentSchedule = generateRepaymentSchedule(p, r, t);
    setSchedule(repaymentSchedule);
    setShowSchedule(false);
  };

  const handleReset = () => {
    setPrincipal('');
    setInterestRate('');
    setTenure('');
    setResult(null);
    setSchedule([]);
    setShowSchedule(false);
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="w-6 h-6 text-gray-700" />
            <h2 className="text-2xl font-bold text-gray-800">EMI Calculator</h2>
          </div>
          <p className="text-gray-600">Calculate your loan EMI and repayment schedule</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Loan Details</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loan Amount (Principal)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-500">$</span>
                  <input
                    type="number"
                    value={principal}
                    onChange={(e) => setPrincipal(e.target.value)}
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="10000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Annual Interest Rate
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="5.5"
                  />
                  <span className="absolute right-3 top-3 text-gray-500">%</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loan Tenure (Months)
                </label>
                <input
                  type="number"
                  value={tenure}
                  onChange={(e) => setTenure(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="12"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleCalculate}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Calculate
                </button>
                <button
                  onClick={handleReset}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          {result && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Results</h3>

              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Monthly EMI</p>
                  <p className="text-3xl font-bold text-blue-700">
                    ${result.emi.toFixed(2)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-xs text-gray-600 mb-1">Principal Amount</p>
                    <p className="text-lg font-semibold text-gray-800">
                      ${result.principal.toFixed(2)}
                    </p>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-xs text-gray-600 mb-1">Total Interest</p>
                    <p className="text-lg font-semibold text-gray-800">
                      ${result.totalInterest.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Total Payment</p>
                  <p className="text-2xl font-bold text-green-700">
                    ${result.totalPayment.toFixed(2)}
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setShowSchedule(!showSchedule)}
                    className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    <Calendar className="w-4 h-4" />
                    {showSchedule ? 'Hide' : 'View'} Repayment Schedule
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {result && showSchedule && schedule.length > 0 && (
          <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Repayment Schedule ({schedule.length} months)
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Month
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Date
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                      Payment
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                      Principal
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                      Interest
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                      Balance
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.map((item) => (
                    <tr key={item.month} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-800">{item.month}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(item.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 text-right font-medium">
                        ${item.payment.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-right">
                        ${item.principal.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-right">
                        ${item.interest.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 text-right font-medium">
                        ${item.balance.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
