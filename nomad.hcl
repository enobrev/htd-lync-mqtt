job "htd-lync-mqtt" {
  type        = "service"
  region      = "local"
  datacenters = ["hamlin"]
  
  group "htd-lync" {
    count = 1
    
    restart {
      attempts = 3
      interval = "5m"
      delay    = "25s"
      mode     = "fail"
    }
    
    
    task "htd-lync" {
      driver = "docker"
      
      config {
        image = "enobrev/htd-lync-mqtt:latest"
      }
      
      env {
        NODE_ENV = "production"
      }
      
      template {
        data = <<EOH
MQTT_BROKER_URL=mqtt://10.0.0.10:1883
LYNC_HOST={{ key "htd-lync/lync_host" }}
LYNC_PORT={{ key "htd-lync/lync_port" }}
HA_DISCOVERY_ENABLED=true
HA_DISCOVERY_PREFIX=homeassistant
EOH
        destination = "local/app.env"
        env         = true
        change_mode = "noop"
      }

      
      resources {
        cpu    = 100
        memory = 128
      }
      
      service {
        name = "htd-lync-mqtt"
      }
    }
  }
}