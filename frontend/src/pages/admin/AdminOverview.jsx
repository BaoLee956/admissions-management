import React, { useState, useEffect } from 'react';
import { 
    Users, Target, Award, Activity, PieChart as PieChartIcon, 
    TrendingUp, Map, BarChart3, Loader2 
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
    PieChart, Pie, Cell, ComposedChart, Area
} from 'recharts';
import apiClient from '../../utils/api';

const AdminOverview = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const res = await apiClient.get('/admin/dashboard/bi-stats');
                setData(res.data.data);
            } catch (error) {
                console.error("Lỗi lấy dữ liệu Dashboard:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full text-indigo-600">
                <Loader2 className="animate-spin" size={40}/>
            </div>
        );
    }
    
    if (!data) {
        return (
            <div className="text-center py-20 text-slate-500 font-medium">
                Chưa có đợt tuyển sinh nào đang hoạt động. Vui lòng mở đợt mới để phân tích dữ liệu.
            </div>
        );
    }

    const { kpis, charts, activeDot } = data;

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-8">
            {/* Tiêu đề & Đợt tuyển sinh */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Activity className="text-indigo-600" /> Trung tâm Phân tích Dữ liệu (BI Dashboard)
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Hệ thống biểu đồ trực quan phục vụ công tác đánh giá và lập chiến lược tuyển sinh.
                    </p>
                </div>
                <div className="bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-xl shrink-0">
                    <span className="text-xs text-indigo-500 font-semibold block">Đợt tuyển sinh hiện tại</span>
                    <span className="text-sm font-bold text-indigo-700">{activeDot}</span>
                </div>
            </div>

            {/* KHỐI 1: CÁC THẺ KPI CHIẾN LƯỢC */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-start">
                        <p className="text-xs font-bold text-slate-500 uppercase">Tổng thí sinh</p>
                        <Users size={16} className="text-blue-500"/>
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 mt-2">{kpis.tongThiSinh}</h3>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-start">
                        <p className="text-xs font-bold text-slate-500 uppercase">Tổng chỉ tiêu</p>
                        <Target size={16} className="text-emerald-500"/>
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 mt-2">{kpis.tongChiTieu}</h3>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-start">
                        <p className="text-xs font-bold text-slate-500 uppercase">Đã trúng tuyển</p>
                        <Award size={16} className="text-amber-500"/>
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 mt-2">{kpis.trungTuyen}</h3>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-start">
                        <p className="text-xs font-bold text-slate-500 uppercase">Tỉ lệ chọi TB</p>
                        <TrendingUp size={16} className="text-red-500"/>
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 mt-2">1 : {kpis.tiLeChoi}</h3>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-start">
                        <p className="text-xs font-bold text-slate-500 uppercase">Tỉ lệ lấp đầy</p>
                        <PieChartIcon size={16} className="text-purple-500"/>
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 mt-2">{kpis.tiLeLapDay}%</h3>
                </div>
            </div>

            {/* KHỐI 2: PHỄU CHUYỂN ĐỔI & TỈ LỆ ĐẬU RỚT */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Phễu chuyển đổi */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <BarChart3 size={16} className="text-indigo-500"/> Phễu chuyển đổi Hồ sơ Tuyển sinh (Funnel Chart)
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={charts.funnel} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                                <XAxis type="number" hide />
                                <YAxis dataKey="stage" type="category" axisLine={false} tickLine={false} fontWeight="bold" fontSize={12} width={100} />
                                <Tooltip cursor={{fill: 'transparent'}} />
                                <Bar dataKey="value" name="Số lượng" barSize={32} radius={[0, 10, 10, 0]}>
                                    {charts.funnel.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={`rgba(79, 70, 229, ${1 - index * 0.22})`} />
                                    ))}
                                </Bar>
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Tỉ lệ đậu rớt */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                        <PieChartIcon size={16} className="text-amber-500"/> Cấu trúc kết quả xét tuyển
                    </h3>
                    <div className="h-64 relative flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={charts.passFail} innerRadius={70} outerRadius={90} paddingAngle={4} dataKey="value" stroke="none">
                                    {charts.passFail.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.fill} />))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} iconType="circle"/>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-3xl font-black text-slate-800">
                                {kpis.tongThiSinh > 0 ? Math.round((kpis.trungTuyen / kpis.tongThiSinh) * 100) : 0}%
                            </span>
                            <span className="text-xs text-slate-500 font-bold">Tỉ lệ Trúng tuyển</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* KHỐI 3: TOP CẠNH TRANH & PHỔ ĐIỂM */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* So sánh Đăng ký vs Chỉ tiêu */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <TrendingUp size={16} className="text-red-500"/> Top Ngành thu hút nguyện vọng cao nhất
                    </h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={charts.topCompetitive} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0"/>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} fontWeight="bold" />
                                <YAxis axisLine={false} tickLine={false} fontSize={12} />
                                <Tooltip cursor={{fill: '#F1F5F9'}} />
                                <Legend iconType="circle" />
                                <Bar dataKey="Chỉ tiêu" fill="#94A3B8" radius={[4, 4, 0, 0]} maxBarSize={35} />
                                <Bar dataKey="Đăng ký" fill="#6366F1" radius={[4, 4, 0, 0]} maxBarSize={35} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Phổ điểm đầu vào */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Activity size={16} className="text-emerald-500"/> Phổ điểm tổng xét tuyển (Nguyện vọng 1)
                    </h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={charts.phoDiem} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0"/>
                                <XAxis dataKey="range" axisLine={false} tickLine={false} fontSize={12} fontWeight="bold"/>
                                <YAxis axisLine={false} tickLine={false} fontSize={12}/>
                                <Tooltip cursor={{fill: '#F1F5F9'}} />
                                <Area type="monotone" dataKey="count" name="Số lượng thí sinh" fill="#D1FAE5" stroke="#10B981" strokeWidth={2.5} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* KHỐI 4: PHÂN BỔ ĐỊA LÝ THEO NGÀNH */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Map size={16} className="text-blue-500"/> Phân tích nguồn tuyển sinh theo Khu vực và Ngành nghề
                </h3>
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={charts.khuVuc} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0"/>
                            <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} fontWeight="bold"/>
                            <YAxis axisLine={false} tickLine={false} fontSize={12}/>
                            <Tooltip cursor={{fill: '#F1F5F9'}} />
                            <Legend iconType="circle" />
                            <Bar dataKey="KV1" stackId="a" fill="#3B82F6" name="Khu vực 1" radius={[0, 0, 4, 4]} maxBarSize={45}/>
                            <Bar dataKey="KV2NT" stackId="a" fill="#60A5FA" name="Khu vực 2 - NT" maxBarSize={45}/>
                            <Bar dataKey="KV2" stackId="a" fill="#93C5FD" name="Khu vực 2" maxBarSize={45}/>
                            <Bar dataKey="KV3" stackId="a" fill="#1D4ED8" name="Khu vực 3" radius={[4, 4, 0, 0]} maxBarSize={45}/>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default AdminOverview;