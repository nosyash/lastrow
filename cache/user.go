package cache

import "log"

// AddUser read information about user from Database and add the user to the user cache
func (u *Users) addUser(uuid string) {
	userProfile, err := u.db.GetUserByUUID(uuid)
	if err != nil {
		log.Printf("u.db.GetUserByUUID(): %v", err)
		return
	}

	u.users[uuid] = &User{
		Name:  userProfile.Name,
		Color: userProfile.Color,
		Image: userProfile.Image,
		Guest: false,
		ID:    getHashOfString(uuid[:8]),
	}

	u.UpdateUsers <- struct{}{}
}

// AddGuest add guest user to the user cache
func (u *Users) addGuest(user *User) {
	u.users[user.UUID] = user
	u.UpdateUsers <- struct{}{}
}

// DelUser delete a user from the cache
func (u *Users) delUser(uuid string) {
	delete(u.users, uuid)
	if len(u.users) > 0 {
		u.UpdateUsers <- struct{}{}
	}
}

// GetUser return user object by UUID
func (u Users) GetUser(uuid string) (*User, bool) {
	user, ok := u.users[uuid]
	return user, ok
}

// UpdateUser update user in cache, image, nickname, color etc.
func (u *Users) UpdateUser(uuid string) {
	userProfile, err := u.db.GetUserByUUID(uuid)
	if err != nil {
		log.Printf("u.db.GetUserByUUID(): %v", err)
	}

	user, ok := u.GetUser(uuid)

	if ok {
		user.Name = userProfile.Name
		user.Color = userProfile.Color
		user.Image = userProfile.Image

		u.UpdateUsers <- struct{}{}
	}
}

// UsersCount return count users for current room
func (u Users) UsersCount() int {
	return len(u.users)
}

// GetAllUsers return all users
func (u Users) GetAllUsers() []*User {
	var users []*User

	for _, user := range u.users {
		users = append(users, &User{
			Name:  user.Name,
			Color: user.Color,
			Image: user.Image,
			ID:    user.ID,
			Guest: user.Guest,
		})
	}

	return users
}
