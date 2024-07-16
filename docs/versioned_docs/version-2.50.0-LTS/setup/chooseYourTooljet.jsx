import React, { useState, useEffect } from 'react';

const LTSVersionsTable = () => {
    const [versions, setVersions] = useState([]);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [copiedVersion, setCopiedVersion] = useState(null);

    useEffect(() => {
        const fetchVersions = async () => {
            setIsLoading(true);
            try {
                const CORS_PROXY = "https://cors-anywhere.herokuapp.com/";
                const API_URL = "https://hub.docker.com/v2/namespaces/tooljet/repositories/tooljet/tags?page_size=100";
                
                const response = await fetch(`${CORS_PROXY}${API_URL}`);
                const data = await response.json();
                
                const ltsVersions = data.results
                    .filter(tag => tag.name.startsWith('EE-LTS-') && tag.name !== 'EE-LTS-latest')
                    .sort((a, b) => new Date(b.last_updated) - new Date(a.last_updated))
                    .slice(0, 5)
                    .map(tag => ({
                        version: tag.name,
                        date: new Date(tag.last_updated).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                        })
                    }));

                setVersions(ltsVersions);
            } catch (err) {
                setError('Failed to fetch versions. Please check back later.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchVersions();
    }, []);

    const copyToClipboard = (text, version) => {
        if (!navigator.clipboard) {
            console.error('Clipboard API not available');
            return;
        }
        navigator.clipboard.writeText(text)
            .then(() => {
                setCopiedVersion(version);
                setTimeout(() => setCopiedVersion(null), 2000);
            })
            .catch(err => console.error('Failed to copy: ', err));
    };

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div style={{ color: 'red' }}>{error}</div>;
    }

    return (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
                <tr>
                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Version</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Release Date</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Docker Pull Command</th>
                </tr>
            </thead>
            <tbody>
                {versions.map((v, index) => (
                    <tr key={index}>
                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                            <a href={`https://hub.docker.com/layers/tooljet/tooljet/${v.version}/images/`} target="_blank" rel="noopener noreferrer" style={{ color: 'blue', textDecoration: 'none' }}>
                                {v.version}
                            </a>
                        </td>
                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{v.date}</td>
                        <td style={{ border: '1px solid #ddd', padding: '8px', display: 'flex', alignItems: 'center' }}>
                            <code style={{ backgroundColor: '#f0f0f0', padding: '2px 4px', borderRadius: '4px', marginRight: '8px' }}>
                                {`docker pull tooljet/tooljet:${v.version}`}
                            </code>
                            <button
                                onClick={() => copyToClipboard(`docker pull tooljet/tooljet:${v.version}`, v.version)}
                                aria-label={`Copy Docker pull command for version ${v.version}`}
                                style={{
                                    padding: '4px',
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <svg 
                                    width="20" 
                                    height="20" 
                                    viewBox="0 0 24 24" 
                                    fill="none" 
                                    stroke={copiedVersion === v.version ? "#45a049" : "#000000"}
                                    strokeWidth="2" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round"
                                >
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                </svg>
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default LTSVersionsTable;