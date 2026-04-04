/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'
import { securityDb } from '../services/database';

const OnDuty = () => {
    const [securityCode, setSecurityCode] = React.useState<string | null>(null);


    const handleGenerate = async () => {
        try {
            const newCode = await securityDb.generateCheckinCode();
            setSecurityCode(newCode); 
        } catch (err: any) {
            console.error(err.message);
        }
    };

  return (
    <div>OnDuty</div>
  )
}

export default OnDuty