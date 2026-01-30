import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface SystemSetting {
    setting_key: string;
    setting_value: any;
}

export function useSystemSettings(settingKey: string) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        fetchSetting();
    }, [settingKey]);

    const fetchSetting = async () => {
        try {
            const { data: setting, error } = await supabase
                .from('system_settings')
                .select('setting_value')
                .eq('setting_key', settingKey)
                .single();

            if (error) throw error;
            setData(setting?.setting_value || null);
        } catch (error) {
            console.error('Error fetching system setting:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateSetting = async (value: any) => {
        try {
            const { error } = await supabase
                .from('system_settings')
                .upsert({
                    setting_key: settingKey,
                    setting_value: value,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'setting_key'
                });

            if (error) {
                console.error('Supabase error details:', error);
                throw error;
            }

            setData(value);
            toast({
                title: "Settings Saved",
                description: "Your configuration has been updated successfully.",
            });
            return true;
        } catch (error) {
            console.error('Error updating system setting:', error);
            toast({
                title: "Error",
                description: "Failed to save settings. Please try again.",
                variant: "destructive"
            });
            return false;
        }
    };

    return { data, loading, updateSetting, refetch: fetchSetting };
}
