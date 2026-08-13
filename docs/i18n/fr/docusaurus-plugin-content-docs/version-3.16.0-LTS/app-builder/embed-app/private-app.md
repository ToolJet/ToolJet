---
id: private-app
title: Application privée
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Intégrer une application ToolJet privée

ToolJet vous permet d'intégrer de manière sécurisée vos applications privées dans des portails, des tableaux de bord ou des systèmes tiers, sans obliger vos utilisateurs à se reconnecter.

Les applications privées intégrées continuent de respecter toutes les permissions et contrôles d'accès du workspace, garantissant que les utilisateurs ne voient que les données et fonctionnalités pour lesquelles ils sont autorisés. Chaque session intégrée est isolée et limitée, de sorte que l'accès est contrôlé par utilisateur et par application, sans interférer avec les autres sessions ToolJet.

**Avantages clés :**
- **Sécurisé par défaut** : Les applications privées restent inaccessibles sans sessions authentifiées
- **Aucune friction de connexion** : Les applications intégrées se chargent de manière fluide dans des iframes, sans redirection
- **Contrôle d'accès précis** : Les sessions héritent des permissions existantes de l'application et du workspace
- **Isolation des sessions** : L'utilisation intégrée n'interfère pas avec les sessions ToolJet principales
- **Accès contrôlé côté backend** : L'authentification et le cycle de vie de la session sont entièrement gérés côté serveur

**Quand utiliser l'intégration d'une application privée**
- Intégrer des applications ToolJet sensibles dans des portails clients ou des tableaux de bord internes
- Intégrer des workflows ToolJet dans des produits SaaS existants ou des systèmes d'administration
- Exposer des outils opérationnels sensibles sans les rendre publics
- Réutiliser des applications ToolJet comme couche d'outils internes sécurisée au sein de votre plateforme

## Flux d'authentification

1. L'utilisateur se connecte à votre portail avec sa méthode d'authentification habituelle.
2. Votre backend génère un jeton d'accès personnel (PAT) limité à cet utilisateur et à cette application.
3. Le backend renvoie une URL d'intégration contenant le PAT.
4. Le frontend affiche l'application ToolJet dans un iframe en utilisant l'URL d'intégration.
5. La session intégrée est isolée et limitée, garantissant que l'utilisateur n'a accès qu'à l'application prévue, sans affecter les autres sessions ToolJet.

Consultez le schéma ci-dessous pour une vue détaillée du flux d'authentification et d'intégration.

<img className="screenshot-full img-full" src="/img/app-builder/embed-apps/auth-flow.png" alt="Auth Flow for Embedding Private ToolJet Application" />

<!-- 
## Example 
-->

## Étapes pour intégrer une application privée

1. [Créez](/docs/getting-started/quickstart-guide) et [publiez](/docs/development-lifecycle/release/release-rollback/) votre application ToolJet.

2. **Configurez votre frontend** : Votre frontend doit demander une URL d'application intégrée à votre backend immédiatement après la connexion de l'utilisateur. Le même email utilisé pour la connexion sera utilisé pour générer l'URL d'intégration ToolJet.

    <Tabs>

        <TabItem value="HTML/JS" label="HTML/JS"> 
            ```HTML
            <!DOCTYPE html>
            <html>
            <body>
            <div id="app-container">
                <p>Loading your dashboard...</p>
            </div>

            <script>
                // This function runs after user successfully logs in
                async function onUserLogin(userEmail) {
                // App ID of the ToolJet app you want to embed
                const appId = '8ba8bf0e-6b8f-4e07-abb9-6fd2d816fabc';
                
                try {
                    // Request the embed URL from your backend
                    const response = await fetch('/api/get-tooljet-url', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: userEmail,
                        appId: appId
                    })
                    });
                    
                    const data = await response.json();
                    
                    if (data.redirectUrl) {
                    // Create and insert iframe
                    const iframe = document.createElement('iframe');
                    iframe.src = data.redirectUrl;
                    iframe.width = '100%';
                    iframe.height = '600px';
                    iframe.style.border = 'none';
                    
                    document.getElementById('app-container').innerHTML = '';
                    document.getElementById('app-container').appendChild(iframe);
                    }
                } catch (error) {
                    console.error('Error loading ToolJet app:', error);
                    document.getElementById('app-container').innerHTML = 
                    '<p>Failed to load dashboard. Please refresh the page.</p>';
                }
                }
                // Call this after your authentication succeeds
                // Example: after successful login response
                // onUserLogin('user@example.com');
            </script>
            </body>
            </html>
            ```
        </TabItem>

        <TabItem value="React" label="React"> 
            ```js
            import React, { useState, useEffect } from 'react';
            import { useAuth } from './AuthContext'; // Your auth context

            function Dashboard() {
            const { user } = useAuth(); // Get logged-in user info
            const [embedUrl, setEmbedUrl] = useState(null);
            const [loading, setLoading] = useState(true);
            
            useEffect(() => {
                // Load ToolJet app as soon as user is available
                if (user?.email) {
                loadToolJetApp(user.email);
                }
            }, [user]);
            
            const loadToolJetApp = async (userEmail) => {
                const appId = '8ba8bf0e-6b8f-4e07-abb9-6fd2d816fabc';
                
                try {
                const response = await fetch('/api/get-tooljet-url', {
                    method: 'POST',
                    headers: {
                    'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                    email: userEmail,
                    appId: appId
                    })
                });
                
                const data = await response.json();
                setEmbedUrl(data.redirectUrl);
                } catch (error) {
                console.error('Error loading ToolJet app:', error);
                } finally {
                setLoading(false);
                }
            };
            
            if (loading) return <div>Loading your dashboard...</div>;
            
            return (
                <div>
                <h1>Welcome, {user?.name}</h1>
                {embedUrl && (
                    <iframe
                    src={embedUrl}
                    width="100%"
                    height="600px"
                    style={{ border: 'none' }}
                    title="ToolJet App"
                    />
                )}
                </div>
            );
            }

            export default Dashboard;
            ```
        </TabItem>

        <TabItem value="Vue.js" label="Vue.js"> 

            ```js
            <template>
                <div>
                    <div v-if="loading">Loading your dashboard...</div>
                    <div v-else-if="error">{{ error }}</div>
                    <iframe
                    v-else-if="embedUrl"
                    :src="embedUrl"
                    width="100%"
                    height="600px"
                    style="border: none"
                    title="ToolJet App"
                    />
                </div>
                </template>

                <script>
                export default {
                name: 'ToolJetEmbed',
                props: {
                    userEmail: {
                    type: String,
                    required: true
                    }
                },
                data() {
                    return {
                    embedUrl: null,
                    loading: true,
                    error: null
                    };
                },
                mounted() {
                    // Load ToolJet app immediately when component mounts
                    this.loadToolJetApp();
                },
                methods: {
                    async loadToolJetApp() {
                    const appId = '8ba8bf0e-6b8f-4e07-abb9-6fd2d816fabc';
                    
                    try {
                        const response = await fetch('/api/get-tooljet-url', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            email: this.userEmail,
                            appId: appId
                        })
                        });
                        
                        if (!response.ok) {
                        throw new Error('Failed to load ToolJet app');
                        }
                        
                        const data = await response.json();
                        this.embedUrl = data.redirectUrl;
                    } catch (error) {
                        console.error('Error loading ToolJet app:', error);
                        this.error = 'Failed to load dashboard. Please refresh the page.';
                    } finally {
                        this.loading = false;
                    }
                    }
                }
                };
                </script>
            ```

        </TabItem>

        <TabItem value="Angular" label="Angular"> 

            ```js
            import { Component, OnInit, Input } from '@angular/core';
            import { HttpClient } from '@angular/common/http';
            import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

            @Component({
            selector: 'app-tooljet-embed',
            template: `
                <div *ngIf="loading">Loading your dashboard...</div>
                <div *ngIf="error">{{ error }}</div>
                <iframe
                *ngIf="embedUrl"
                [src]="embedUrl"
                width="100%"
                height="600px"
                style="border: none"
                title="ToolJet App"
                ></iframe>
            `
            })
            export class ToolJetEmbedComponent implements OnInit {
            @Input() userEmail!: string;
            
            embedUrl: SafeResourceUrl | null = null;
            loading = true;
            error: string | null = null;

            constructor(
                private http: HttpClient,
                private sanitizer: DomSanitizer
            ) {}

            ngOnInit() {
                // Load ToolJet app immediately when component initializes
                this.loadToolJetApp();
            }

            async loadToolJetApp() {
                const appId = '8ba8bf0e-6b8f-4e07-abb9-6fd2d816fabc';
                
                try {
                const response: any = await this.http.post('/api/get-tooljet-url', {
                    email: this.userEmail,
                    appId: appId
                }).toPromise();
                
                // Sanitize the URL for security
                this.embedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(response.redirectUrl);
                } catch (error) {
                console.error('Error loading ToolJet app:', error);
                this.error = 'Failed to load dashboard. Please refresh the page.';
                } finally {
                this.loading = false;
                }
            }
            }
            ```

        </TabItem>

    </Tabs>

3. **Configurez votre backend** : Votre backend est responsable d'appeler de manière sécurisée l'API ToolJet pour générer un Personal Access Token et renvoyer l'URL d'intégration.

    <Tabs>

        <TabItem value="node" label="Node.js/Express"> 

            ```js
            const express = require('express');
            const axios = require('axios');
            const app = express();

            app.use(express.json());

            // Your ToolJet configuration
            const TOOLJET_HOST = 'https://your-tooljet-instance.com'; // or http://localhost:3000
            const TOOLJET_API_TOKEN = 'your_basic_auth_token_here'; // Keep this secret!

            app.post('/api/get-tooljet-url', async (req, res) => {
            const { email, appId } = req.body;
            
            // Validate the request
            if (!email || !appId) {
                return res.status(400).json({ error: 'Email and appId are required' });
            }
            
            try {
                // Call ToolJet API to generate PAT
                const response = await axios.post(
                `${TOOLJET_HOST}/api/ext/users/personal-access-token`,
                {
                    email: email,
                    appId: appId,
                    sessionExpiry: 60,      // Session valid for 60 minutes
                    patExpiry: 3600         // Token valid for 1 hour (3600 seconds)
                },
                {
                    headers: {
                    'Authorization': `Basic ${TOOLJET_API_TOKEN}`,
                    'Content-Type': 'application/json'
                    }
                }
                );
                
                // Return the redirect URL to frontend
                res.json({
                redirectUrl: response.data.redirectUrl
                });
                
            } catch (error) {
                console.error('ToolJet API Error:', error.response?.data || error.message);
                
                // Handle specific error cases
                if (error.response?.status === 404) {
                return res.status(404).json({ error: 'User not found in ToolJet' });
                }
                if (error.response?.status === 403) {
                return res.status(403).json({ error: 'User does not have access to this app' });
                }
                if (error.response?.status === 429) {
                return res.status(429).json({ error: 'Too many requests. Please try again later.' });
                }
                
                res.status(500).json({ error: 'Failed to generate embed URL' });
            }
            });

            app.listen(3001, () => {
            console.log('Server running on port 3001');
            });
            ```
        </TabItem>

        <TabItem value="py" label="Python/Flask"> 
            ```python
            from flask import Flask, request, jsonify
            import requests

            app = Flask(__name__)

            # Your ToolJet configuration
            TOOLJET_HOST = 'https://your-tooljet-instance.com'  # or http://localhost:3000
            TOOLJET_API_TOKEN = 'your_basic_auth_token_here'  # Keep this secret!

            @app.route('/api/get-tooljet-url', methods=['POST'])
            def get_tooljet_url():
                data = request.get_json()
                email = data.get('email')
                app_id = data.get('appId')
                
                # Validate the request
                if not email or not app_id:
                    return jsonify({'error': 'Email and appId are required'}), 400
                
                try:
                    # Call ToolJet API to generate PAT
                    response = requests.post(
                        f'{TOOLJET_HOST}/api/ext/users/personal-access-token',
                        json={
                            'email': email,
                            'appId': app_id,
                            'sessionExpiry': 60,    # Session valid for 60 minutes
                            'patExpiry': 3600       # Token valid for 1 hour (3600 seconds)
                        },
                        headers={
                            'Authorization': f'Basic {TOOLJET_API_TOKEN}',
                            'Content-Type': 'application/json'
                        }
                    )
                    
                    response.raise_for_status()
                    
                    # Return the redirect URL to frontend
                    return jsonify({
                        'redirectUrl': response.json()['redirectUrl']
                    })
                    
                except requests.exceptions.HTTPError as e:
                    status_code = e.response.status_code
                    
                    # Handle specific error cases
                    if status_code == 404:
                        return jsonify({'error': 'User not found in ToolJet'}), 404
                    elif status_code == 403:
                        return jsonify({'error': 'User does not have access to this app'}), 403
                    elif status_code == 429:
                        return jsonify({'error': 'Too many requests. Please try again later.'}), 429
                    
                    return jsonify({'error': 'Failed to generate embed URL'}), 500
                
                except Exception as e:
                    print(f'Error: {str(e)}')
                    return jsonify({'error': 'Failed to generate embed URL'}), 500

            if __name__ == '__main__':
                app.run(port=3001)
            ```
        </TabItem>

        <TabItem value="php" label="PHP/Laravel"> 

            ```php
            <?php

            namespace App\Http\Controllers;

            use Illuminate\Http\Request;
            use Illuminate\Support\Facades\Http;

            class ToolJetController extends Controller
            {
                public function getToolJetUrl(Request $request)
                {
                    // Validate the request
                    $validated = $request->validate([
                        'email' => 'required|email',
                        'appId' => 'required|string',
                    ]);
                    
                    $tooljetHost = env('TOOLJET_HOST', 'https://your-tooljet-instance.com');
                    $tooljetApiToken = env('TOOLJET_API_TOKEN'); // Keep this in .env file
                    
                    try {
                        // Call ToolJet API to generate PAT
                        $response = Http::withHeaders([
                            'Authorization' => 'Basic ' . $tooljetApiToken,
                            'Content-Type' => 'application/json',
                        ])->post($tooljetHost . '/api/ext/users/personal-access-token', [
                            'email' => $validated['email'],
                            'appId' => $validated['appId'],
                            'sessionExpiry' => 60,    // Session valid for 60 minutes
                            'patExpiry' => 3600       // Token valid for 1 hour (3600 seconds)
                        ]);
                        
                        if ($response->failed()) {
                            $statusCode = $response->status();
                            
                            // Handle specific error cases
                            if ($statusCode === 404) {
                                return response()->json(['error' => 'User not found in ToolJet'], 404);
                            } elseif ($statusCode === 403) {
                                return response()->json(['error' => 'User does not have access to this app'], 403);
                            } elseif ($statusCode === 429) {
                                return response()->json(['error' => 'Too many requests. Please try again later.'], 429);
                            }
                            
                            return response()->json(['error' => 'Failed to generate embed URL'], 500);
                        }
                        
                        // Return the redirect URL to frontend
                        return response()->json([
                            'redirectUrl' => $response->json()['redirectUrl']
                        ]);
                        
                    } catch (\Exception $e) {
                        \Log::error('ToolJet API Error: ' . $e->getMessage());
                        return response()->json(['error' => 'Failed to generate embed URL'], 500);
                    }
                }
            }
            ```

        </TabItem>

    </Tabs>


4. **Mettez à jour l'iframe dynamiquement** : L'iframe est créée et chargée automatiquement une fois que le redirectUrl est reçu depuis votre backend. Utilisez le rendu conditionnel pour afficher l'iframe uniquement lorsque l'URL est disponible.

    <Tabs>

        <TabItem value="JS" label="JavaScript"> 
            ```js
            function displayToolJetApp(redirectUrl) {
            const container = document.getElementById('app-container');
            
            if (redirectUrl) {
                const iframe = document.createElement('iframe');
                iframe.src = redirectUrl;
                iframe.width = '100%';
                iframe.height = '600px';
                iframe.style.border = 'none';
                iframe.title = 'ToolJet Application';
                
                // Clear loading message and add iframe
                container.innerHTML = '';
                container.appendChild(iframe);
            }
            }
            ```
        </TabItem>

        <TabItem value="React" label="React"> 
            ```js
            {embedUrl && (
            <iframe
                src={embedUrl}
                width="100%"
                height="600px"
                style={{ border: 'none' }}
                title="ToolJet Application"
            />
            )}
            ```
        </TabItem>

        <TabItem value="Vue.js" label="Vue.js"> 

            ```js
            <iframe
            v-if="embedUrl"
            :src="embedUrl"
            width="100%"
            height="600px"
            style="border: none"
            title="ToolJet Application"
            />
            ```

        </TabItem>

        <TabItem value="Angular" label="Angular"> 

            ```js
            <iframe
            *ngIf="embedUrl"
            [src]="embedUrl"
            width="100%"
            height="600px"
            style="border: none"
            title="ToolJet Application"
            ></iframe>
            ```

        </TabItem>

    </Tabs>
