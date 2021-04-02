Rails.application.routes.draw do
  # For details on the DSL available within this file, see https://guides.rubyonrails.org/routing.html

  resources :apps, only: [:create, :show, :update]

  post 'authenticate', to: 'authentication#authenticate'
end
