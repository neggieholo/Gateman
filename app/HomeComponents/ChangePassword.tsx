import React, { useState } from 'react';
import { changePassword } from '../services/apis';

const ChangePassword = () => {
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [status, setStatus] = useState({ type: '', msg: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // 1. Validation
        if (formData.newPassword !== formData.confirmPassword) {
            return setStatus({ type: 'error', msg: 'Passwords do not match' });
        }

        if (formData.newPassword.length < 6) {
            return setStatus({ type: 'error', msg: 'Password must be at least 6 characters' });
        }

        setLoading(true);
        setStatus({ type: '', msg: '' }); // Clear previous status

        try {
            // 2. Call the shared service
            // Since this is the Admin Web panel, we pass "admin" as the role
            const data = await changePassword(
                formData.currentPassword, 
                formData.newPassword, 
                "admin"
            );

            // 3. Handle the response
            if (data.success) {
                setStatus({ type: 'success', msg: 'Password changed successfully!' });
                setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                // Displays "Current password is incorrect" or other server-side messages
                setStatus({ type: 'error', msg: data.message || 'Update failed' });
            }
        } catch (err) {
            setStatus({ type: 'error', msg: 'A network error occurred. Please try again.' });
        } finally {
            setLoading(false);
        }
    };



    return (
        <div style={{ maxWidth: '400px', margin: '2rem auto', fontFamily: 'sans-serif' }}>
            <h2 style={{ color: '#2563eb' }}>Change Password</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input
                    type="password"
                    placeholder="Current Password"
                    required
                    style={inputStyle}
                    value={formData.currentPassword}
                    onChange={(e) => setFormData({...formData, currentPassword: e.target.value})}
                />
                <input
                    type="password"
                    placeholder="New Password"
                    required
                    style={inputStyle}
                    value={formData.newPassword}
                    onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                />
                <input
                    type="password"
                    placeholder="Confirm New Password"
                    required
                    style={inputStyle}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                />
                <button 
                    type="submit" 
                    disabled={loading}
                    style={{ backgroundColor: '#2563eb', color: 'white', padding: '10px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                    {loading ? 'Processing...' : 'Change Password'}
                </button>
            </form>
            {status.msg && (
                <p style={{ marginTop: '1rem', color: status.type === 'error' ? '#ef4444' : '#22c55e' }}>
                    {status.msg}
                </p>
            )}
        </div>
    );
};

const inputStyle = { padding: '10px', borderRadius: '4px', border: '1px solid #ccc' };

export default ChangePassword;