Rails.application.routes.draw do

  resources :apps, only: [:index, :create, :show, :update] do
    get '/users', to: 'apps#users'
  end

  resources :data_sources, only: [:create, :index]

  resources :data_queries, only: [:create, :index, :update] do 
    post '/run', to: 'data_queries#run'
  end

  post 'authenticate', to: 'authentication#authenticate'
end
